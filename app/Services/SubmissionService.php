<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\AwardedBadge;
use App\Models\Badge;
use App\Models\BadgeRequirement;
use App\Models\Notification;
use App\Models\Submission;
use App\Models\User;
use App\Support\RichText;

/**
 * Advancement mutations — the port of src/actions/advancement.ts.
 *
 * Keeps the two-level approval model: a Scout Leader approves first (level 1),
 * then a Council Admin confirms (level 2). A rejection returns the work to the
 * Scout with a comment.
 */
class SubmissionService
{
    public function __construct(private readonly AdvancementService $advancement) {}

    /**
     * @param  array{textContent?: mixed, mediaUrl?: ?string, mediaType?: ?string, externalUrl?: ?string, driveFileId?: ?string, driveSharedWith?: ?string, storageProvider?: ?string, quiz?: array<int, mixed>}  $input
     * @return array{error?: string, ok?: bool}
     */
    public function submitRequirement(User $user, int $requirementId, array $input): array
    {
        $requirement = BadgeRequirement::query()->find($requirementId);
        if (! $requirement) {
            return ['error' => 'That requirement no longer exists.'];
        }
        if ($requirement->type === BadgeRequirement::TYPE_MERIT) {
            return ['error' => 'This requirement is met by earning another badge.'];
        }

        $lock = $this->advancement->getRankLock($requirement->badge_id, $user->id);
        if ($lock['locked']) {
            return ['error' => "This rank is locked. Earn the {$lock['lockedByName']} first."];
        }

        $badge = Badge::query()->find($requirement->badge_id);
        if ($badge && $badge->kind === Badge::KIND_RANK) {
            $programLock = $this->advancement->getProgramLock($badge->program_id, $user->id);
            if ($programLock['locked']) {
                return ['error' => "Level {$programLock['level']} is locked. Finish the {$programLock['lockedByName']} first."];
            }
        }

        $existing = Submission::query()
            ->where('user_id', $user->id)
            ->where('requirement_id', $requirementId)
            ->first();

        if ($existing?->status === Submission::STATUS_APPROVED) {
            return ['error' => 'This requirement is already approved.'];
        }

        $textContent = RichText::normalize($input['textContent'] ?? '');
        $mediaUrl = trim((string) ($input['mediaUrl'] ?? '')) ?: null;
        $mediaType = trim((string) ($input['mediaType'] ?? '')) ?: null;
        $externalUrl = trim((string) ($input['externalUrl'] ?? '')) ?: null;
        $driveFileId = trim((string) ($input['driveFileId'] ?? '')) ?: null;
        $driveSharedWith = trim((string) ($input['driveSharedWith'] ?? '')) ?: null;
        $storageProvider = trim((string) ($input['storageProvider'] ?? '')) ?: 'server';

        if ($requirement->requires_text && ! $textContent) {
            return ['error' => 'Please write your answer before submitting.'];
        }
        if ($requirement->requires_media && ! $mediaUrl) {
            return ['error' => 'Please attach your video or image proof.'];
        }
        if ($requirement->requires_link && ! $externalUrl) {
            return ['error' => 'Please add your Google Drive link.'];
        }

        $questions = $this->advancement->parseQuiz($requirement->quiz_json) ?? [];
        $answersJson = null;
        $quizScore = null;

        if (count($questions)) {
            $provided = $input['quiz'] ?? [];
            $answers = [];
            $correct = 0;
            foreach ($questions as $index => $question) {
                $picked = isset($provided[$index]) && is_numeric($provided[$index]) ? (int) $provided[$index] : -1;
                $answers[] = $picked;
                if ($picked === (int) $question['answer']) {
                    $correct++;
                }
            }
            $answersJson = json_encode($answers);
            $quizScore = (int) round(($correct / count($questions)) * 100);
        }

        $values = [
            'user_id' => $user->id,
            'kind' => Submission::KIND_REQUIREMENT,
            'badge_id' => $requirement->badge_id,
            'requirement_id' => $requirementId,
            'text_content' => $textContent,
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'external_url' => $externalUrl,
            'drive_file_id' => $driveFileId,
            'drive_url' => $driveFileId ? $mediaUrl : null,
            'drive_shared_with' => $driveFileId ? $driveSharedWith : null,
            'storage_provider' => $storageProvider,
            'quiz_json' => $answersJson,
            'quiz_score' => $quizScore,
            'status' => Submission::STATUS_PENDING,
            'levels_approved' => 0,
            'levels_required' => 2,
            'decided_at' => null,
        ];

        if ($existing) {
            $existing->update($values);
        } else {
            Submission::create($values);
        }

        $this->notify(
            $user->id,
            'Submission sent for approval',
            "{$requirement->title} was submitted. A Scout Leader will review it first.",
            "/advancement/badge/{$requirement->badge_id}",
        );

        return ['ok' => true];
    }

    public function submitBadgeApplication(User $user, int $badgeId): void
    {
        $badge = Badge::query()->find($badgeId);
        if (! $badge) {
            return;
        }

        $lock = $this->advancement->getRankLock($badgeId, $user->id);
        if ($lock['locked']) {
            return;
        }
        if ($badge->kind === Badge::KIND_RANK) {
            $programLock = $this->advancement->getProgramLock($badge->program_id, $user->id);
            if ($programLock['locked']) {
                return;
            }
        }

        $alreadyAwarded = AwardedBadge::query()
            ->where('user_id', $user->id)
            ->where('badge_id', $badgeId)
            ->exists();
        if ($alreadyAwarded) {
            return;
        }

        $existing = Submission::query()
            ->where('user_id', $user->id)
            ->where('badge_id', $badgeId)
            ->where('kind', Submission::KIND_BADGE)
            ->whereNull('requirement_id')
            ->first();

        $requirements = BadgeRequirement::query()->where('badge_id', $badgeId)->get();
        $userSubmissions = Submission::query()->where('user_id', $user->id)->get();
        $userAwarded = AwardedBadge::query()->where('user_id', $user->id)->get();

        $earnedIds = $userAwarded->pluck('badge_id')->flip()->all();
        $allMet = $requirements->every(function ($req) use ($earnedIds, $userSubmissions) {
            if ($req->type === BadgeRequirement::TYPE_MERIT && $req->required_badge_id) {
                return isset($earnedIds[$req->required_badge_id]);
            }

            return $userSubmissions->contains(
                fn ($row) => $row->requirement_id === $req->id && $row->status === Submission::STATUS_APPROVED,
            );
        });

        if (! $allMet) {
            return;
        }

        if ($existing) {
            $existing->update([
                'status' => Submission::STATUS_PENDING,
                'levels_approved' => 0,
                'submitted_at' => now(),
                'decided_at' => null,
            ]);
        } else {
            Submission::create([
                'user_id' => $user->id,
                'kind' => Submission::KIND_BADGE,
                'badge_id' => $badgeId,
                'requirement_id' => null,
                'status' => Submission::STATUS_PENDING,
                'levels_approved' => 0,
                'levels_required' => 2,
            ]);
        }

        $this->notify(
            $user->id,
            'Badge submitted for approval',
            "{$badge->name} was submitted. A Scout Leader will review it first.",
            "/advancement/badge/{$badgeId}",
        );
    }

    public function decide(User $user, int $submissionId, string $decision, ?string $comment): void
    {
        if ($user->isStudent()) {
            return;
        }

        $submission = Submission::query()->find($submissionId);
        if (! $submission) {
            return;
        }
        if (in_array($submission->status, [Submission::STATUS_APPROVED, Submission::STATUS_REJECTED], true)) {
            return;
        }

        $prior = Approval::query()
            ->where('submission_id', $submissionId)
            ->where('approver_id', $user->id)
            ->exists();
        if ($prior) {
            return;
        }

        $decision = $decision === 'rejected' ? 'rejected' : 'approved';
        $comment = $comment !== null && trim($comment) !== '' ? trim($comment) : null;
        $level = $submission->levels_approved === 0 ? 1 : 2;

        if ($level === 1 && $submission->status !== Submission::STATUS_PENDING) {
            return;
        }
        if ($level === 2 && ($submission->status !== Submission::STATUS_LEVEL1_APPROVED || ! $user->isAdmin())) {
            return;
        }

        Approval::create([
            'submission_id' => $submissionId,
            'approver_id' => $user->id,
            'level' => $level,
            'decision' => $decision,
            'comment' => $comment,
        ]);

        $badge = Badge::query()->find($submission->badge_id);
        $badgeName = $badge->name ?? 'badge';

        if ($decision === 'rejected') {
            $submission->update([
                'status' => Submission::STATUS_REJECTED,
                'decided_at' => now(),
            ]);

            $href = $submission->requirement_id
                ? "/advancement/requirement/{$submission->requirement_id}"
                : "/advancement/badge/{$submission->badge_id}";

            $this->notify(
                $submission->user_id,
                'Submission needs revision',
                trim("{$user->name} asked for changes on {$badgeName}. ".($comment ?? '')),
                $href,
            );

            return;
        }

        $nextLevels = $submission->levels_approved + 1;
        $approved = $nextLevels >= $submission->levels_required;

        $submission->update([
            'levels_approved' => $nextLevels,
            'status' => $approved ? Submission::STATUS_APPROVED : Submission::STATUS_LEVEL1_APPROVED,
            'decided_at' => $approved ? now() : null,
        ]);

        if ($approved && $submission->kind === Submission::KIND_BADGE) {
            $already = AwardedBadge::query()
                ->where('user_id', $submission->user_id)
                ->where('badge_id', $submission->badge_id)
                ->exists();

            if (! $already) {
                AwardedBadge::create([
                    'user_id' => $submission->user_id,
                    'badge_id' => $submission->badge_id,
                ]);
            }

            $this->notify(
                $submission->user_id,
                'Badge awarded ⚜️',
                "{$badgeName} is now on your record. Congratulations, Scout!",
                '/advancement',
            );

            return;
        }

        $this->notify(
            $submission->user_id,
            $approved ? 'Requirement approved' : 'Progress confirmed (1 of 2)',
            $approved
                ? "{$user->name} approved your work on {$badgeName}."
                : "{$user->name} confirmed your work on {$badgeName}. Waiting for the council to confirm.",
            "/advancement/badge/{$submission->badge_id}",
        );
    }

    public function markNotificationsRead(User $user): void
    {
        Notification::query()->where('user_id', $user->id)->update(['read' => true]);
    }

    public function notify(int $userId, string $title, string $body, ?string $href = null): void
    {
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'href' => $href,
        ]);
    }
}

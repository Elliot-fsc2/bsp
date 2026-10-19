<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\Approval;
use App\Models\AwardedBadge;
use App\Models\Badge;
use App\Models\BadgeCategory;
use App\Models\BadgeRequirement;
use App\Models\CalendarEvent;
use App\Models\Notification;
use App\Models\Program;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Read model for the advancement domain — the port of src/lib/queries.ts.
 *
 * Returns plain arrays with camelCase keys (matching the original TypeScript
 * shapes) so the Blade/Livewire views can consume them naturally.
 */
class AdvancementService
{
    /** @return Collection<int, Program> */
    public function programs(): Collection
    {
        return Program::query()->orderBy('position')->orderBy('id')->get();
    }

    public function programBySlug(string $slug): ?Program
    {
        return Program::query()->where('slug', $slug)->first();
    }

    public function programById(int $id): ?Program
    {
        return Program::query()->find($id);
    }

    /** @return Collection<int, Badge> */
    public function badges(): Collection
    {
        return Badge::query()->orderBy('position')->orderBy('id')->get();
    }

    /** @return Collection<int, BadgeCategory> */
    public function categories(): Collection
    {
        return BadgeCategory::query()->orderBy('position')->orderBy('id')->get();
    }

    /**
     * Awarded badges for a user, keyed by badge id.
     *
     * @return array<int, AwardedBadge>
     */
    public function earnedMap(int $userId): array
    {
        return AwardedBadge::query()
            ->where('user_id', $userId)
            ->get()
            ->keyBy('badge_id')
            ->all();
    }

    /**
     * Port of computeProgramAccess(): a level opens only when the previous
     * level is complete, unless the Scout already has work in that level.
     *
     * @param  Collection<int, Program>  $programRows
     * @param  array<int, array<int, object>>  $ranksByProgram
     * @param  array<int, mixed>  $earned
     * @param  array<int, bool>  $engagedProgramIds
     * @return array<int, array<string, mixed>>
     */
    public function computeProgramAccess(Collection $programRows, array $ranksByProgram, array $earned, array $engagedProgramIds): array
    {
        $access = [];
        $blocker = null;

        foreach ($programRows->values() as $index => $program) {
            $ranks = $ranksByProgram[$program->id] ?? [];
            $ranksEarned = 0;
            foreach ($ranks as $rank) {
                if (isset($earned[$rank->id])) {
                    $ranksEarned++;
                }
            }
            $ranksTotal = count($ranks);
            $complete = $ranksTotal === 0 || $ranksEarned === $ranksTotal;
            $allowed = $index === 0 || $blocker === null || isset($engagedProgramIds[$program->id]);

            $access[$program->id] = [
                'level' => $index + 1,
                'locked' => ! $allowed,
                'lockedByName' => $allowed ? null : $blocker,
                'ranksEarned' => $ranksEarned,
                'ranksTotal' => $ranksTotal,
                'complete' => $complete,
            ];

            if (! $complete && $blocker === null) {
                $blocker = $program->name;
            }
        }

        return $access;
    }

    public function parseQuiz(?string $value): ?array
    {
        if (! $value) {
            return null;
        }

        $parsed = json_decode($value, true);

        return is_array($parsed) && count($parsed) ? $parsed : null;
    }

    /**
     * Port of getAdvancement(): program progress + per-badge progress.
     *
     * @return array{programs: array<int, array<string, mixed>>, badges: array<int, array<string, mixed>>}
     */
    public function getAdvancement(int $userId): array
    {
        $programRows = $this->programs();
        $badgeRows = $this->badges();
        $requirementRows = BadgeRequirement::query()->orderBy('position')->orderBy('id')->get();
        $submissionRows = Submission::query()->where('user_id', $userId)->get();
        $earned = $this->earnedMap($userId);
        $categoryRows = $this->categories();

        $programMap = $programRows->keyBy('id');
        $categoryMap = $categoryRows->keyBy('id');
        $badgeById = $badgeRows->keyBy('id');
        $badgeNameMap = $badgeRows->pluck('name', 'id')->all();

        $ranksByProgram = [];
        foreach ($badgeRows as $badge) {
            if ($badge->kind !== Badge::KIND_RANK) {
                continue;
            }
            $ranksByProgram[$badge->program_id][] = $badge;
        }
        foreach ($ranksByProgram as &$list) {
            usort($list, fn ($a, $b) => ($a->position <=> $b->position) ?: ($a->id <=> $b->id));
        }
        unset($list);

        $badgeProgram = $badgeRows->pluck('program_id', 'id')->all();
        $engagedProgramIds = [];
        foreach ($submissionRows as $row) {
            $programId = $badgeProgram[$row->badge_id] ?? null;
            if ($programId) {
                $engagedProgramIds[$programId] = true;
            }
        }
        foreach (array_keys($earned) as $badgeId) {
            $programId = $badgeProgram[$badgeId] ?? null;
            if ($programId) {
                $engagedProgramIds[$programId] = true;
            }
        }

        $access = $this->computeProgramAccess($programRows, $ranksByProgram, $earned, $engagedProgramIds);

        $programProgress = [];
        foreach ($programRows as $program) {
            $entry = $access[$program->id] ?? ['level' => 0, 'locked' => false, 'lockedByName' => null, 'ranksEarned' => 0, 'ranksTotal' => 0, 'complete' => false];
            $programProgress[] = [
                'id' => $program->id,
                'name' => $program->name,
                'slug' => $program->slug,
                'section' => $program->section,
                'ageRange' => $program->age_range,
                'description' => $program->description,
                'color' => $program->color,
                'icon' => $program->icon,
                'position' => $program->position,
            ] + $entry;
        }

        $submissionsByRequirement = [];
        $badgeApplications = [];
        foreach ($submissionRows as $row) {
            if ($row->kind === Submission::KIND_REQUIREMENT && $row->requirement_id) {
                $submissionsByRequirement[$row->requirement_id] = $row;
            }
            if ($row->kind === Submission::KIND_BADGE) {
                $badgeApplications[$row->badge_id] = $row;
            }
        }

        $requiredByMap = [];
        foreach ($requirementRows as $requirement) {
            if ($requirement->type !== BadgeRequirement::TYPE_MERIT || ! $requirement->required_badge_id) {
                continue;
            }
            $rank = $badgeById[$requirement->badge_id] ?? null;
            if (! $rank) {
                continue;
            }
            $requiredByMap[$requirement->required_badge_id][] = [
                'id' => $rank->id,
                'name' => $rank->name,
                'programName' => $programMap[$rank->program_id]->name ?? 'Program',
            ];
        }

        $progress = [];
        foreach ($badgeRows as $badge) {
            $program = $programMap[$badge->program_id] ?? null;
            $category = $badge->category_id ? ($categoryMap[$badge->category_id] ?? null) : null;
            $programRanks = $ranksByProgram[$badge->program_id] ?? [];
            $rankIndex = null;
            foreach ($programRanks as $i => $rank) {
                if ($rank->id === $badge->id) {
                    $rankIndex = $i;
                    break;
                }
            }
            $rankStep = ($badge->kind === Badge::KIND_RANK && $rankIndex !== null) ? $rankIndex + 1 : null;

            $lockedByName = null;
            if ($badge->kind === Badge::KIND_RANK && $rankIndex !== null && $rankIndex > 0) {
                for ($i = 0; $i < $rankIndex; $i++) {
                    if (! isset($earned[$programRanks[$i]->id])) {
                        $lockedByName = $programRanks[$i]->name;
                        break;
                    }
                }
            }

            $requirements = [];
            foreach ($requirementRows as $r) {
                if ($r->badge_id !== $badge->id) {
                    continue;
                }
                $submission = $submissionsByRequirement[$r->id] ?? null;
                $satisfiedByMerit = $r->type === BadgeRequirement::TYPE_MERIT && $r->required_badge_id
                    ? isset($earned[$r->required_badge_id])
                    : false;
                $satisfied = $satisfiedByMerit || ($submission?->status === Submission::STATUS_APPROVED);

                $requirements[] = [
                    'id' => $r->id,
                    'title' => $r->title,
                    'description' => $r->description,
                    'instructions' => $r->instructions,
                    'type' => $r->type,
                    'position' => $r->position,
                    'requiresText' => $r->requires_text,
                    'requiresMedia' => $r->requires_media,
                    'mediaKind' => $r->media_kind,
                    'requiresLink' => $r->requires_link,
                    'points' => $r->points,
                    'quiz' => $this->parseQuiz($r->quiz_json),
                    'requiredBadgeId' => $r->required_badge_id,
                    'requiredBadgeName' => $r->required_badge_id ? ($badgeNameMap[$r->required_badge_id] ?? null) : null,
                    'submissionId' => $submission?->id,
                    'status' => $submission?->status,
                    'satisfied' => $satisfied,
                    'satisfiedByMerit' => $satisfiedByMerit,
                ];
            }

            $satisfiedCount = count(array_filter($requirements, fn ($r) => $r['satisfied']));
            $totalCount = count($requirements);
            $application = $badgeApplications[$badge->id] ?? null;
            $awardedAt = $earned[$badge->id]->awarded_at ?? null;
            $canApply = ! $awardedAt
                && $totalCount > 0
                && $satisfiedCount === $totalCount
                && (! $application || $application->status === Submission::STATUS_REJECTED);

            $progress[] = [
                'id' => $badge->id,
                'name' => $badge->name,
                'slug' => $badge->slug,
                'kind' => $badge->kind,
                'description' => $badge->description,
                'imageUrl' => $badge->image_url,
                'isMembership' => $badge->is_membership,
                'position' => $badge->position,
                'programId' => $badge->program_id,
                'programName' => $program->name ?? 'Program',
                'programColor' => $program->color ?? '#2d6a4f',
                'programIcon' => $program->icon ?? '*',
                'categoryId' => $badge->category_id,
                'categoryName' => $category->name ?? null,
                'categoryColor' => $category->color ?? null,
                'categoryIcon' => $category->icon ?? null,
                'rankStep' => $rankStep,
                'rankCount' => $badge->kind === Badge::KIND_RANK ? count($programRanks) : null,
                'locked' => $lockedByName !== null,
                'lockedByName' => $lockedByName,
                'requiredBy' => $requiredByMap[$badge->id] ?? [],
                'requirements' => $requirements,
                'satisfiedCount' => $satisfiedCount,
                'totalCount' => $totalCount,
                'percent' => $totalCount ? (int) round(($satisfiedCount / $totalCount) * 100) : 0,
                'earned' => (bool) $awardedAt,
                'awardedAt' => $awardedAt,
                'applicationStatus' => $application?->status,
                'canApply' => $canApply,
            ];
        }

        return ['programs' => $programProgress, 'badges' => $progress];
    }

    /**
     * @return array{locked: bool, lockedByName: ?string, level: int}
     */
    public function getProgramLock(int $programId, int $userId): array
    {
        $programRows = $this->programs();
        $badgeRows = Badge::query()->get();
        $submissionRows = Submission::query()->where('user_id', $userId)->get(['badge_id']);
        $earned = $this->earnedMap($userId);

        $ranksByProgram = [];
        $badgeProgram = [];
        foreach ($badgeRows as $badge) {
            $badgeProgram[$badge->id] = $badge->program_id;
            if ($badge->kind !== Badge::KIND_RANK) {
                continue;
            }
            $ranksByProgram[$badge->program_id][] = (object) ['id' => $badge->id];
        }

        $engagedProgramIds = [];
        foreach ($submissionRows as $row) {
            $id = $badgeProgram[$row->badge_id] ?? null;
            if ($id) {
                $engagedProgramIds[$id] = true;
            }
        }
        foreach (array_keys($earned) as $badgeId) {
            $id = $badgeProgram[$badgeId] ?? null;
            if ($id) {
                $engagedProgramIds[$id] = true;
            }
        }

        $access = $this->computeProgramAccess($programRows, $ranksByProgram, $earned, $engagedProgramIds);

        return $access[$programId] ?? ['locked' => false, 'lockedByName' => null, 'level' => 0];
    }

    /**
     * @return array{locked: bool, lockedByName: ?string}
     */
    public function getRankLock(int $badgeId, int $userId): array
    {
        $badge = Badge::query()->find($badgeId);
        if (! $badge || $badge->kind !== Badge::KIND_RANK) {
            return ['locked' => false, 'lockedByName' => null];
        }

        $programRanks = Badge::query()
            ->where('program_id', $badge->program_id)
            ->where('kind', Badge::KIND_RANK)
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $earned = $this->earnedMap($userId);

        $index = null;
        foreach ($programRanks as $i => $rank) {
            if ($rank->id === $badge->id) {
                $index = $i;
                break;
            }
        }

        if ($index !== null) {
            for ($i = 0; $i < $index; $i++) {
                if (! isset($earned[$programRanks[$i]->id])) {
                    return ['locked' => true, 'lockedByName' => $programRanks[$i]->name];
                }
            }
        }

        return ['locked' => false, 'lockedByName' => null];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getBadgeProgress(int $badgeId, int $userId): ?array
    {
        foreach ($this->getAdvancement($userId)['badges'] as $badge) {
            if ($badge['id'] === $badgeId) {
                return $badge;
            }
        }

        return null;
    }

    /**
     * @return array{requirement: BadgeRequirement, badge: ?Badge, submission: ?Submission, approvals: Collection<int, Approval>}|null
     */
    public function getRequirementWork(int $requirementId, int $userId): ?array
    {
        $requirement = BadgeRequirement::query()->find($requirementId);
        if (! $requirement) {
            return null;
        }

        $badge = Badge::query()->find($requirement->badge_id);
        $submission = Submission::query()
            ->where('user_id', $userId)
            ->where('requirement_id', $requirementId)
            ->first();

        $approvals = $submission
            ? Approval::query()->with('approver')->where('submission_id', $submission->id)->orderBy('level')->orderBy('created_at')->get()
            : collect();

        return [
            'requirement' => $requirement,
            'badge' => $badge,
            'submission' => $submission,
            'approvals' => $approvals,
        ];
    }

    /** @return Collection<int, Submission> */
    public function getMySubmissions(int $userId): Collection
    {
        return Submission::query()
            ->with(['badge', 'requirement'])
            ->where('user_id', $userId)
            ->orderByDesc('submitted_at')
            ->get();
    }

    /** @return Collection<int, AwardedBadge> */
    public function getAwardedBadges(int $userId): Collection
    {
        return AwardedBadge::query()
            ->with(['badge.program'])
            ->where('user_id', $userId)
            ->orderByDesc('awarded_at')
            ->get();
    }

    /**
     * @return array{pending: Collection<int, Submission>, decided: Collection<int, Submission>}
     */
    public function getApprovalQueue(User $user): array
    {
        $statuses = $user->isAdmin()
            ? [Submission::STATUS_PENDING, Submission::STATUS_LEVEL1_APPROVED]
            : [Submission::STATUS_PENDING];

        $pending = Submission::query()
            ->with(['user', 'badge', 'requirement'])
            ->whereIn('status', $statuses)
            ->orderBy('status')
            ->orderBy('submitted_at')
            ->get();

        $decided = Submission::query()
            ->with(['user', 'badge', 'requirement'])
            ->whereIn('status', [Submission::STATUS_APPROVED, Submission::STATUS_REJECTED])
            ->orderByDesc('decided_at')
            ->limit(30)
            ->get();

        return ['pending' => $pending, 'decided' => $decided];
    }

    /**
     * @return array{submission: Submission, badge: ?Badge, requirement: ?BadgeRequirement, approvals: Collection<int, Approval>}|null
     */
    public function getSubmissionDetail(int $submissionId): ?array
    {
        $submission = Submission::query()->with('user')->find($submissionId);
        if (! $submission) {
            return null;
        }

        $badge = Badge::query()->find($submission->badge_id);
        $requirement = $submission->requirement_id ? BadgeRequirement::query()->find($submission->requirement_id) : null;
        $approvals = Approval::query()
            ->with('approver')
            ->where('submission_id', $submissionId)
            ->orderBy('level')
            ->orderBy('created_at')
            ->get();

        return [
            'submission' => $submission,
            'badge' => $badge,
            'requirement' => $requirement,
            'approvals' => $approvals,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getDashboardData(User $user): array
    {
        $advancement = $this->getAdvancement($user->id);
        $awarded = $this->getAwardedBadges($user->id);

        $inProgress = array_values(array_filter($advancement['badges'], fn ($b) => ! $b['earned'] && $b['satisfiedCount'] > 0));
        usort($inProgress, fn ($a, $b) => $b['percent'] <=> $a['percent']);
        $inProgress = array_slice($inProgress, 0, 4);

        $announcements = Announcement::query()->with('author')->orderByDesc('pinned')->orderByDesc('created_at')->limit(6)->get();
        $events = CalendarEvent::query()->orderBy('start_at')->limit(5)->get();

        $pendingApprovals = collect();
        if (! $user->isStudent()) {
            $statuses = $user->isAdmin()
                ? [Submission::STATUS_PENDING, Submission::STATUS_LEVEL1_APPROVED]
                : [Submission::STATUS_PENDING];
            $pendingApprovals = Submission::query()
                ->with(['user', 'badge', 'requirement'])
                ->whereIn('status', $statuses)
                ->orderBy('submitted_at')
                ->limit(6)
                ->get();
        }

        $allUsers = $user->isAdmin() ? User::query()->orderBy('created_at')->get() : collect();

        return [
            'programs' => $advancement['programs'],
            'badges' => $advancement['badges'],
            'awarded' => $awarded,
            'inProgress' => $inProgress,
            'announcements' => $announcements,
            'events' => $events,
            'pendingApprovals' => $pendingApprovals,
            'totals' => [
                'users' => $allUsers->count(),
                'programs' => count($advancement['programs']),
                'awarded' => $awarded->count(),
                'inProgress' => count(array_filter($advancement['badges'], fn ($b) => ! $b['earned'] && $b['satisfiedCount'] > 0)),
            ],
        ];
    }

    /** @return Collection<int, Notification> */
    public function getNotifications(int $userId): Collection
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(12)
            ->get();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use App\Services\AdvancementService;
use App\Services\SubmissionService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdvancementController extends Controller
{
    public function __construct(
        private readonly AdvancementService $advancement,
    ) {}

    public function index(Request $request): View
    {
        $user = $request->user();
        $data = $this->advancement->getAdvancement($user->id);
        $awarded = $this->advancement->getAwardedBadges($user->id);

        $inProgress = array_values(array_filter($data['badges'], fn ($b) => ! $b['earned'] && $b['satisfiedCount'] > 0));
        $readyToApply = array_values(array_filter($data['badges'], fn ($b) => $b['canApply']));

        return view('advancement.index', [
            'programs' => $data['programs'],
            'badges' => $data['badges'],
            'awarded' => $awarded,
            'inProgressCount' => count($inProgress),
            'readyToApply' => $readyToApply,
        ]);
    }

    public function program(string $programSlug, Request $request): View
    {
        $program = $this->advancement->programBySlug($programSlug);
        abort_if($program === null, 404);

        $user = $request->user();
        $data = $this->advancement->getAdvancement($user->id);

        $entry = null;
        foreach ($data['programs'] as $row) {
            if ($row['id'] === $program->id) {
                $entry = $row;
                break;
            }
        }

        $ranks = array_values(array_filter(
            $data['badges'],
            fn ($b) => $b['programId'] === $program->id && $b['kind'] === Badge::KIND_RANK,
        ));
        usort($ranks, fn ($a, $b) => ($a['position'] <=> $b['position']) ?: ($a['id'] <=> $b['id']));

        return view('advancement.program', [
            'program' => $program,
            'entry' => $entry,
            'locked' => $entry['locked'] ?? false,
            'ranks' => $ranks,
        ]);
    }

    public function badge(int $badge, Request $request): View
    {
        $user = $request->user();
        $progress = $this->advancement->getBadgeProgress($badge, $user->id);
        abort_if($progress === null, 404);

        $programLock = $progress['kind'] === Badge::KIND_RANK
            ? $this->advancement->getProgramLock($progress['programId'], $user->id)
            : ['locked' => false, 'lockedByName' => null, 'level' => 0];

        return view('advancement.badge', [
            'badge' => $progress,
            'programLock' => $programLock,
            'locked' => $progress['locked'] || $programLock['locked'],
        ]);
    }

    public function applyBadge(int $badge, Request $request, SubmissionService $submissions): RedirectResponse
    {
        $submissions->submitBadgeApplication($request->user(), $badge);

        return redirect()
            ->route('advancement.badge', $badge)
            ->with('status', 'Badge submitted for approval.');
    }

    public function requirement(int $requirement, Request $request): View
    {
        $user = $request->user();
        $data = $this->advancement->getRequirementWork($requirement, $user->id);
        abort_if($data === null, 404);

        $badge = $data['badge'];
        $lock = $this->advancement->getRankLock($data['requirement']->badge_id, $user->id);
        $programLock = ($badge && $badge->kind === Badge::KIND_RANK)
            ? $this->advancement->getProgramLock($badge->program_id, $user->id)
            : ['locked' => false, 'lockedByName' => null, 'level' => 0];

        return view('advancement.requirement', [
            'requirement' => $data['requirement'],
            'badge' => $badge,
            'submission' => $data['submission'],
            'approvals' => $data['approvals'],
            'lock' => $lock,
            'programLock' => $programLock,
        ]);
    }

    public function meritBadges(Request $request): View
    {
        $user = $request->user();
        $data = $this->advancement->getAdvancement($user->id);
        $merits = array_values(array_filter($data['badges'], fn ($b) => $b['kind'] === Badge::KIND_MERIT));

        return view('advancement.merit-badges', [
            'badges' => $merits,
            'programs' => $data['programs'],
        ]);
    }

    public function myAdvancement(Request $request): View
    {
        $user = $request->user();
        $data = $this->advancement->getAdvancement($user->id);

        return view('advancement.my', [
            'programs' => $data['programs'],
            'badges' => $data['badges'],
            'submissions' => $this->advancement->getMySubmissions($user->id),
        ]);
    }
}

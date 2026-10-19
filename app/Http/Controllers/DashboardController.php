<?php

namespace App\Http\Controllers;

use App\Services\AdvancementService;
use App\Services\SubmissionService;
use App\Support\SiteSettings;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AdvancementService $advancement,
    ) {}

    public function index(Request $request): View
    {
        $user = $request->user();
        $data = $this->advancement->getDashboardData($user);

        $readyToApply = array_values(array_filter($data['badges'], fn ($b) => $b['canApply']));

        return view('dashboard', [
            'user' => $user,
            'settings' => SiteSettings::all(),
            'awarded' => $data['awarded'],
            'inProgress' => $data['inProgress'],
            'announcements' => $data['announcements'],
            'events' => $data['events'],
            'pendingApprovals' => $data['pendingApprovals'],
            'totals' => $data['totals'],
            'readyToApplyCount' => count($readyToApply),
            'greeting' => $this->greetingForNow($user->name),
            'notifications' => $this->advancement->getNotifications($user->id),
        ]);
    }

    public function markNotifications(Request $request, SubmissionService $submissions): RedirectResponse
    {
        $submissions->markNotificationsRead($request->user());

        return redirect('/dashboard');
    }

    private function greetingForNow(string $name): string
    {
        $hour = (int) now()->format('G');
        $first = Str::of($name)->explode(' ')->first() ?: $name;

        if ($hour < 12) {
            return "Good morning, {$first}!";
        }
        if ($hour < 17) {
            return "Good afternoon, {$first}!";
        }

        return "Good evening, {$first}!";
    }
}

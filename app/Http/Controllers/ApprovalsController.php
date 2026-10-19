<?php

namespace App\Http\Controllers;

use App\Services\AdvancementService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class ApprovalsController extends Controller
{
    public function __construct(
        private readonly AdvancementService $advancement,
    ) {}

    public function index(Request $request): View
    {
        $queue = $this->advancement->getApprovalQueue($request->user());

        return view('approvals.index', [
            'pending' => $queue['pending'],
            'decided' => $queue['decided'],
        ]);
    }

    public function show(int $submission, Request $request): View
    {
        $data = $this->advancement->getSubmissionDetail($submission);
        abort_if($data === null, 404);

        $user = $request->user();
        $model = $data['submission'];
        $waitingLevel = $model->levels_approved === 0 ? 1 : 2;
        $alreadyDecided = $data['approvals']->contains(fn ($a) => $a->approver_id === $user->id);
        $canDecide = in_array($model->status, ['pending', 'level1_approved'], true)
            && ($waitingLevel === 1 || $user->isAdmin())
            && ! $alreadyDecided;

        return view('approvals.show', [
            'submission' => $model,
            'badge' => $data['badge'],
            'requirement' => $data['requirement'],
            'approvals' => $data['approvals'],
            'waitingLevel' => $waitingLevel,
            'canDecide' => $canDecide,
        ]);
    }
}

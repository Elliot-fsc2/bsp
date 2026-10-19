<?php

namespace App\Livewire\Approvals;

use App\Services\SubmissionService;
use Livewire\Component;

/**
 * The approve / ask-for-revision panel shown to Scout Leaders and Council Admins
 * on the review page.
 */
class DecisionPanel extends Component
{
    public int $submissionId;

    public string $comment = '';

    public function mount(int $submissionId): void
    {
        $this->submissionId = $submissionId;
    }

    public function decide(string $decision, SubmissionService $submissions): void
    {
        $submissions->decide(auth()->user(), $this->submissionId, $decision, $this->comment);

        $this->redirect(route('approvals.index'));
    }

    public function render()
    {
        return view('livewire.approvals.decision-panel');
    }
}

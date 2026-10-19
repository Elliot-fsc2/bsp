<?php

namespace Tests\Feature;

use App\Models\AwardedBadge;
use App\Models\Badge;
use App\Models\Notification;
use App\Models\Submission;
use App\Models\User;
use App\Services\AdvancementService;
use App\Services\SubmissionService;
use Database\Seeders\BspSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BspSeeder::class);
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    public function test_two_level_approval_is_enforced(): void
    {
        $paolo = $this->user('paolo@bsp.org.ph');
        $miguel = $this->user('miguel@bsp.org.ph');   // Scout Leader
        $rosario = $this->user('rosario@bsp.org.ph'); // Scout Leader
        $admin = $this->user('admin@bsp.org.ph');     // Council Admin
        $service = app(SubmissionService::class);

        $submission = Submission::where('user_id', $paolo->id)
            ->where('status', Submission::STATUS_PENDING)
            ->firstOrFail();

        // A Scout cannot approve.
        $service->decide($paolo, $submission->id, 'approved', null);
        $this->assertSame(Submission::STATUS_PENDING, $submission->fresh()->status);

        // Level 1: a Scout Leader.
        $service->decide($miguel, $submission->id, 'approved', 'Well done.');
        $submission->refresh();
        $this->assertSame(Submission::STATUS_LEVEL1_APPROVED, $submission->status);
        $this->assertSame(1, $submission->levels_approved);

        // Another Scout Leader cannot jump to level 2.
        $service->decide($rosario, $submission->id, 'approved', null);
        $this->assertSame(Submission::STATUS_LEVEL1_APPROVED, $submission->fresh()->status);

        // Level 2: a Council Admin.
        $service->decide($admin, $submission->id, 'approved', 'Confirmed.');
        $submission->refresh();
        $this->assertSame(Submission::STATUS_APPROVED, $submission->status);
        $this->assertSame(2, $submission->levels_approved);
        $this->assertNotNull($submission->decided_at);

        $this->assertDatabaseCount('approvals', 12 + 2); // 12 seeded + 2 new
    }

    public function test_the_same_approver_cannot_decide_twice(): void
    {
        $paolo = $this->user('paolo@bsp.org.ph');
        $miguel = $this->user('miguel@bsp.org.ph');
        $service = app(SubmissionService::class);

        $submission = Submission::where('user_id', $paolo->id)->where('status', Submission::STATUS_PENDING)->firstOrFail();

        $service->decide($miguel, $submission->id, 'approved', null);
        $service->decide($miguel, $submission->id, 'approved', null);

        $this->assertSame(1, $submission->approvals()->where('approver_id', $miguel->id)->count());
    }

    public function test_a_rejection_returns_the_work_with_a_comment(): void
    {
        $paolo = $this->user('paolo@bsp.org.ph');
        $miguel = $this->user('miguel@bsp.org.ph');
        $service = app(SubmissionService::class);

        $submission = Submission::where('user_id', $paolo->id)->where('status', Submission::STATUS_PENDING)->firstOrFail();

        $service->decide($miguel, $submission->id, 'rejected', 'Please record the full video.');

        $submission->refresh();
        $this->assertSame(Submission::STATUS_REJECTED, $submission->status);

        $notification = Notification::where('user_id', $paolo->id)->where('title', 'Submission needs revision')->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('Please record the full video.', $notification->body);
    }

    public function test_a_badge_application_is_awarded_after_both_approvals(): void
    {
        $service = app(SubmissionService::class);
        $advancement = app(AdvancementService::class);

        $scout = User::factory()->create();
        $miguel = $this->user('miguel@bsp.org.ph');
        $admin = $this->user('admin@bsp.org.ph');

        $badge = Badge::where('slug', 'merit-nature-study')->firstOrFail();
        $requirement = $badge->requirements()->first();

        // Satisfy the badge's only requirement.
        Submission::create([
            'user_id' => $scout->id,
            'kind' => Submission::KIND_REQUIREMENT,
            'badge_id' => $badge->id,
            'requirement_id' => $requirement->id,
            'text_content' => 'I noticed a dewdrop web.',
            'status' => Submission::STATUS_APPROVED,
            'levels_approved' => 2,
            'levels_required' => 2,
            'decided_at' => now(),
        ]);

        $this->assertTrue($advancement->getBadgeProgress($badge->id, $scout->id)['canApply']);

        $service->submitBadgeApplication($scout, $badge->id);

        $application = Submission::where('user_id', $scout->id)
            ->where('badge_id', $badge->id)
            ->where('kind', Submission::KIND_BADGE)
            ->firstOrFail();
        $this->assertSame(Submission::STATUS_PENDING, $application->status);

        $service->decide($miguel, $application->id, 'approved', null);
        $this->assertSame(Submission::STATUS_LEVEL1_APPROVED, $application->fresh()->status);
        $this->assertFalse(AwardedBadge::where('user_id', $scout->id)->where('badge_id', $badge->id)->exists());

        $service->decide($admin, $application->id, 'approved', null);
        $this->assertSame(Submission::STATUS_APPROVED, $application->fresh()->status);
        $this->assertTrue(AwardedBadge::where('user_id', $scout->id)->where('badge_id', $badge->id)->exists());
    }

    public function test_a_badge_cannot_be_applied_for_until_every_requirement_is_met(): void
    {
        $service = app(SubmissionService::class);

        $scout = User::factory()->create();
        $badge = Badge::where('slug', 'merit-nature-study')->firstOrFail();

        $service->submitBadgeApplication($scout, $badge->id);

        $this->assertDatabaseMissing('submissions', [
            'user_id' => $scout->id,
            'badge_id' => $badge->id,
            'kind' => Submission::KIND_BADGE,
        ]);
    }
}

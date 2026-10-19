<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\BadgeRequirement;
use App\Models\Notification;
use App\Models\Submission;
use App\Models\User;
use App\Services\SubmissionService;
use Database\Seeders\BspSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequirementSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function requirementFor(string $badgeSlug, int $position): BadgeRequirement
    {
        $badgeId = Badge::where('slug', $badgeSlug)->value('id');

        return BadgeRequirement::where('badge_id', $badgeId)->orderBy('position')->skip($position)->firstOrFail();
    }

    public function test_submitting_a_requirement_creates_a_pending_submission_and_notification(): void
    {
        $this->seed(BspSeeder::class);
        $scout = User::factory()->create();
        $service = app(SubmissionService::class);

        // KID membership anthem: recite — needs a written answer and video proof.
        $requirement = $this->requirementFor('kid-membership', 0);

        $result = $service->submitRequirement($scout, $requirement->id, [
            'textContent' => 'I sang Lupang Hinirang with my patrol.',
            'mediaUrl' => '/uploads/anthem.mp4',
            'mediaType' => 'video',
            'storageProvider' => 'server',
        ]);

        $this->assertTrue($result['ok'] ?? false);

        $this->assertDatabaseHas('submissions', [
            'user_id' => $scout->id,
            'requirement_id' => $requirement->id,
            'status' => Submission::STATUS_PENDING,
            'levels_approved' => 0,
            'levels_required' => 2,
        ]);

        $this->assertSame(1, Notification::where('user_id', $scout->id)->count());
    }

    public function test_submission_requires_the_proof_the_requirement_asks_for(): void
    {
        $this->seed(BspSeeder::class);
        $scout = User::factory()->create();
        $service = app(SubmissionService::class);

        $requirement = $this->requirementFor('kid-membership', 0); // needs text + media

        $missingText = $service->submitRequirement($scout, $requirement->id, [
            'mediaUrl' => '/uploads/anthem.mp4',
            'mediaType' => 'video',
        ]);
        $this->assertArrayHasKey('error', $missingText);

        $missingMedia = $service->submitRequirement($scout, $requirement->id, [
            'textContent' => 'Here it is.',
        ]);
        $this->assertArrayHasKey('error', $missingMedia);

        $this->assertSame(0, Submission::where('user_id', $scout->id)->count());
    }

    public function test_quiz_answers_are_graded_when_submitted(): void
    {
        $this->seed(BspSeeder::class);
        $scout = User::factory()->create();
        $service = app(SubmissionService::class);

        // First Aid merit badge — a quiz. Merit badges are not rank-locked.
        $requirement = $this->requirementFor('merit-first-aid', 0);

        $result = $service->submitRequirement($scout, $requirement->id, [
            'quiz' => [1, 1],
        ]);

        $this->assertTrue($result['ok'] ?? false);

        $submission = Submission::where('user_id', $scout->id)->firstOrFail();
        $this->assertSame(100, $submission->quiz_score);
        $this->assertSame('[1,1]', $submission->quiz_json);
    }

    public function test_a_scout_cannot_submit_into_a_locked_level(): void
    {
        $this->seed(BspSeeder::class);
        $scout = User::factory()->create();
        $service = app(SubmissionService::class);

        // Boy-membership is level 2; a brand-new Scout is still on level 1 (KID).
        $requirement = $this->requirementFor('boy-membership', 0);

        $result = $service->submitRequirement($scout, $requirement->id, [
            'textContent' => 'Attempting anyway.',
            'mediaUrl' => '/uploads/x.mp4',
            'mediaType' => 'video',
        ]);

        $this->assertArrayHasKey('error', $result);
        $this->assertStringContainsString('locked', $result['error']);
        $this->assertSame(0, Submission::where('user_id', $scout->id)->count());
    }

    public function test_a_merit_requirement_cannot_be_submitted_directly(): void
    {
        $this->seed(BspSeeder::class);
        $scout = User::factory()->create();
        $service = app(SubmissionService::class);

        $meritRequirement = BadgeRequirement::where('type', BadgeRequirement::TYPE_MERIT)->firstOrFail();

        $result = $service->submitRequirement($scout, $meritRequirement->id, [
            'textContent' => 'Done.',
        ]);

        $this->assertArrayHasKey('error', $result);
    }
}

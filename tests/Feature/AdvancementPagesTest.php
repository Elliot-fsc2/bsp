<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\BspSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdvancementPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(BspSeeder::class);
    }

    public function test_a_scout_can_open_every_advancement_page(): void
    {
        $paolo = User::where('email', 'paolo@bsp.org.ph')->firstOrFail();
        $membership = Badge::where('slug', 'boy-membership')->firstOrFail();
        $requirement = $membership->requirements()->first();

        $this->actingAs($paolo);

        $this->get('/advancement')->assertOk()->assertSee('Your trail to the top');
        $this->get('/advancement/boy-scouts')->assertOk()->assertSee('Rank ladder');
        $this->get('/advancement/badge/'.$membership->id)->assertOk()->assertSee('Requirements');
        $this->get('/advancement/requirement/'.$requirement->id)->assertOk();
        $this->get('/merit-badges')->assertOk()->assertSee('Merit badges');
        $this->get('/my-advancement')->assertOk()->assertSee('What you still need to do');
        $this->get('/dashboard')->assertOk()->assertSee('Continue your advancement');
    }

    public function test_a_scout_cannot_reach_the_approvals_queue(): void
    {
        $paolo = User::where('email', 'paolo@bsp.org.ph')->firstOrFail();

        $this->actingAs($paolo)->get('/approvals')->assertRedirect('/dashboard');
    }

    public function test_a_scout_leader_sees_the_approvals_queue_and_can_review(): void
    {
        $miguel = User::where('email', 'miguel@bsp.org.ph')->firstOrFail();

        $this->actingAs($miguel)
            ->get('/approvals')
            ->assertOk()
            ->assertSee('Advancement approvals')
            ->assertSee('Waiting for you');

        $submission = Submission::where('status', 'pending')->firstOrFail();
        $this->actingAs($miguel)->get('/approvals/'.$submission->id)->assertOk()->assertSee('Your decision');
    }

    public function test_unknown_program_and_badge_slugs_are_not_found(): void
    {
        $paolo = User::where('email', 'paolo@bsp.org.ph')->firstOrFail();

        $this->actingAs($paolo)->get('/advancement/does-not-exist')->assertNotFound();
        $this->actingAs($paolo)->get('/advancement/badge/999999')->assertNotFound();
    }
}

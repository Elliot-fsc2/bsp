<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\BadgeRequirement;
use App\Models\Program;
use App\Models\User;
use App\Services\AdvancementService;
use Database\Seeders\BspSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdvancementLocksTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_rank_stays_locked_until_the_previous_rank_is_earned(): void
    {
        $this->seed(BspSeeder::class);

        $scout = User::factory()->create();
        $service = app(AdvancementService::class);

        $membership = Badge::where('slug', 'boy-membership')->firstOrFail();
        $tenderfoot = Badge::where('slug', 'boy-tenderfoot')->firstOrFail();

        // The first rank of a ladder is never locked by rank order.
        $this->assertFalse($service->getRankLock($membership->id, $scout->id)['locked']);

        $lock = $service->getRankLock($tenderfoot->id, $scout->id);
        $this->assertTrue($lock['locked']);
        $this->assertSame('Membership Rank', $lock['lockedByName']);
    }

    public function test_merit_badges_are_never_locked_by_a_rank_ladder(): void
    {
        $this->seed(BspSeeder::class);

        $scout = User::factory()->create();
        $merit = Badge::where('slug', 'merit-first-aid')->firstOrFail();

        $this->assertFalse(app(AdvancementService::class)->getRankLock($merit->id, $scout->id)['locked']);
    }

    public function test_program_levels_open_in_order_and_a_scout_keeps_access_to_engaged_levels(): void
    {
        $this->seed(BspSeeder::class);

        $service = app(AdvancementService::class);
        $kid = Program::where('slug', 'kid-scouts')->firstOrFail();
        $boy = Program::where('slug', 'boy-scouts')->firstOrFail();

        // A brand-new Scout: KID (level 1) is open, Boy (level 2) is locked.
        $newScout = User::factory()->create();
        $this->assertFalse($service->getProgramLock($kid->id, $newScout->id)['locked']);

        $boyLock = $service->getProgramLock($boy->id, $newScout->id);
        $this->assertTrue($boyLock['locked']);
        $this->assertSame(2, $boyLock['level']);
        $this->assertSame('KID Scout Program', $boyLock['lockedByName']);

        // Paolo already has work in the Boy program, so he never loses access.
        $paolo = User::where('email', 'paolo@bsp.org.ph')->firstOrFail();
        $this->assertFalse($service->getProgramLock($boy->id, $paolo->id)['locked']);
    }

    public function test_advancement_progress_reports_completion_and_satisfied_requirements(): void
    {
        $this->seed(BspSeeder::class);

        $paolo = User::where('email', 'paolo@bsp.org.ph')->firstOrFail();
        $data = app(AdvancementService::class)->getAdvancement($paolo->id);

        $membership = collect($data['badges'])->firstWhere('slug', 'boy-membership');
        $this->assertNotNull($membership);

        // Paolo has an approved anthem submission, so that requirement is satisfied.
        $anthem = collect($membership['requirements'])
            ->first(fn ($r) => str_starts_with($r['title'], 'Sing the Philippine National Anthem'));
        $this->assertNotNull($anthem);
        $this->assertTrue($anthem['satisfied']);
        $this->assertSame('approved', $anthem['status']);
        $this->assertGreaterThan(0, $membership['satisfiedCount']);

        // The KID Scout nature-study merit badge has been awarded to Bea.
        $bea = User::where('email', 'bea@bsp.org.ph')->firstOrFail();
        $beaAdvancement = app(AdvancementService::class)->getAdvancement($bea->id);
        $nature = collect($beaAdvancement['badges'])->firstWhere('slug', 'merit-nature-study');
        $this->assertTrue($nature['earned']);
    }

    public function test_requirement_work_loads_existing_submission_and_approvals(): void
    {
        $this->seed(BspSeeder::class);

        $paolo = User::where('email', 'paolo@bsp.org.ph')->firstOrFail();
        $anthem = BadgeRequirement::where('badge_id', Badge::where('slug', 'boy-membership')->value('id'))
            ->where('position', 0)
            ->firstOrFail();

        $work = app(AdvancementService::class)->getRequirementWork($anthem->id, $paolo->id);

        $this->assertNotNull($work);
        $this->assertSame('approved', $work['submission']->status);
        $this->assertCount(2, $work['approvals']);
    }
}

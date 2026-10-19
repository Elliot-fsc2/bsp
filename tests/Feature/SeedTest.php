<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\BadgeCategory;
use App\Models\BadgeRequirement;
use App\Models\Program;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\BspSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_reproduces_the_original_dataset(): void
    {
        $this->seed(BspSeeder::class);

        $this->assertSame(15, User::count());
        $this->assertSame(1, User::where('role', User::ROLE_ADMIN)->count());
        $this->assertSame(4, User::where('role', User::ROLE_TEACHER)->count());
        $this->assertSame(10, User::where('role', User::ROLE_STUDENT)->count());

        $this->assertSame(3, Program::count());
        $this->assertSame(5, BadgeCategory::count());

        $this->assertSame(17, Badge::count());
        $this->assertSame(9, Badge::where('kind', Badge::KIND_RANK)->count());
        $this->assertSame(8, Badge::where('kind', Badge::KIND_MERIT)->count());
        $this->assertSame(33, BadgeRequirement::count());

        $this->assertSame(11, Submission::count());
        $this->assertSame(5, Submission::where('status', Submission::STATUS_APPROVED)->count());
        $this->assertSame(2, Submission::where('status', Submission::STATUS_LEVEL1_APPROVED)->count());
        $this->assertSame(4, Submission::where('status', Submission::STATUS_PENDING)->count());

        $this->assertDatabaseCount('approvals', 12);
        $this->assertDatabaseCount('awarded_badges', 1);
        $this->assertDatabaseCount('announcements', 4);
        $this->assertDatabaseCount('forum_topics', 3);
        $this->assertDatabaseCount('forum_posts', 7);
        $this->assertDatabaseCount('notifications', 4);
        $this->assertDatabaseCount('calendar_events', 4);
        $this->assertDatabaseCount('site_settings', 10);
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(BspSeeder::class);
        $this->seed(BspSeeder::class);

        $this->assertSame(15, User::count());
        $this->assertSame(17, Badge::count());
    }

    public function test_seeded_passwords_verify_against_laginghanda(): void
    {
        $this->seed(BspSeeder::class);

        $admin = User::where('email', 'admin@bsp.org.ph')->firstOrFail();

        $this->assertTrue(Hash::check('laginghanda', $admin->password_hash));
    }
}

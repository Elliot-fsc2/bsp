<?php

namespace Tests\Feature;

use App\Models\Session;
use App\Models\User;
use Database\Seeders\BspSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(BspSeeder::class);
    }

    private function sessionTokenFor(string $email): string
    {
        $user = User::query()->where('email', $email)->firstOrFail();
        $token = bin2hex(random_bytes(32));

        Session::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addDays(14),
        ]);

        return $token;
    }

    public function test_landing_login_and_register_pages_render(): void
    {
        $this->get('/')->assertOk();
        $this->get('/login')->assertOk()->assertSee('Log in to the BSP portal');
        $this->get('/register')->assertOk()->assertSee('Create account');
    }

    public function test_guest_is_redirected_to_login_with_next(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString('/login', $location);
        $this->assertStringContainsString('next=', $location);
    }

    public function test_demo_scout_can_log_in(): void
    {
        $response = $this->post('/login', [
            'email' => 'paolo@bsp.org.ph',
            'password' => 'laginghanda',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseCount('sessions', 1);

        $cookieNames = array_map(fn ($cookie) => $cookie->getName(), $response->headers->getCookies());
        $this->assertContains('bsp_session', $cookieNames);

        $this->assertNotNull(User::query()->where('email', 'paolo@bsp.org.ph')->value('last_login_at'));
    }

    public function test_login_rejects_a_bad_password(): void
    {
        $this->from('/login')->post('/login', [
            'email' => 'paolo@bsp.org.ph',
            'password' => 'wrong-password',
        ])->assertRedirect('/login')->assertSessionHasErrors('email');

        $this->assertDatabaseCount('sessions', 0);
        $this->assertNull(User::query()->where('email', 'paolo@bsp.org.ph')->value('last_login_at'));
    }

    public function test_inactive_account_cannot_log_in(): void
    {
        User::query()->where('email', 'paolo@bsp.org.ph')->update(['is_active' => false]);

        $this->from('/login')->post('/login', [
            'email' => 'paolo@bsp.org.ph',
            'password' => 'laginghanda',
        ])->assertRedirect('/login')->assertSessionHasErrors('email');

        $this->assertDatabaseCount('sessions', 0);
    }

    public function test_session_cookie_authenticates_a_request(): void
    {
        $token = $this->sessionTokenFor('paolo@bsp.org.ph');

        $this->withUnencryptedCookie('bsp_session', $token)
            ->get('/dashboard')
            ->assertOk()
            ->assertSee('Continue your advancement')
            ->assertSee('Paolo');
    }

    public function test_expired_session_is_rejected(): void
    {
        $user = User::query()->where('email', 'paolo@bsp.org.ph')->firstOrFail();
        $token = bin2hex(random_bytes(32));

        Session::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->subMinute(),
        ]);

        $this->withUnencryptedCookie('bsp_session', $token)
            ->get('/dashboard')
            ->assertRedirect();
    }

    public function test_logout_deletes_the_session(): void
    {
        $token = $this->sessionTokenFor('paolo@bsp.org.ph');

        $this->withUnencryptedCookie('bsp_session', $token)
            ->post('/logout')
            ->assertRedirect(route('login'));

        $this->assertDatabaseCount('sessions', 0);
    }

    public function test_registration_creates_a_student_and_signs_them_in(): void
    {
        $response = $this->post('/register', [
            'name' => 'New Scout',
            'email' => 'new@bsp.org.ph',
            'password' => 'laginghanda',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', ['email' => 'new@bsp.org.ph', 'role' => 'student']);

        $user = User::query()->where('email', 'new@bsp.org.ph')->firstOrFail();
        $this->assertDatabaseHas('sessions', ['user_id' => $user->id]);
    }

    public function test_registration_rejects_short_password_and_duplicate_email(): void
    {
        $this->from('/register')->post('/register', [
            'name' => 'Shorty',
            'email' => 'shorty@bsp.org.ph',
            'password' => '123',
        ])->assertSessionHasErrors('password');

        $this->from('/register')->post('/register', [
            'name' => 'Paolo Again',
            'email' => 'paolo@bsp.org.ph',
            'password' => 'laginghanda',
        ])->assertSessionHasErrors('email');

        $this->assertDatabaseMissing('users', ['email' => 'shorty@bsp.org.ph']);
    }
}

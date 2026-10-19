<?php

namespace App\Auth;

use App\Models\Session;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

/**
 * Token guard backed by the portal's own `sessions` table.
 *
 * The browser carries an opaque session token in the `bsp_session` cookie. This
 * guard resolves the current user from that token, mirroring the behaviour of
 * the original Next.js app (src/lib/auth.ts) without using Laravel's session
 * driver or its differently-shaped `sessions` table.
 */
class SessionTokenGuard implements Guard
{
    protected ?Authenticatable $user = null;

    protected bool $resolved = false;

    public function __construct(
        protected Request $request,
        protected UserProvider $provider,
    ) {}

    public function check(): bool
    {
        return $this->user() !== null;
    }

    public function guest(): bool
    {
        return ! $this->check();
    }

    public function user(): ?Authenticatable
    {
        if ($this->resolved) {
            return $this->user;
        }

        $this->resolved = true;

        $token = $this->request->cookie($this->cookieName());
        if (! $token) {
            return null;
        }

        $session = Session::query()
            ->with('user')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $session || ! $session->user || ! $session->user->is_active) {
            return null;
        }

        return $this->user = $session->user;
    }

    public function id(): int|string|null
    {
        return $this->user()?->getAuthIdentifier();
    }

    public function validate(array $credentials = []): bool
    {
        $email = strtolower(trim((string) ($credentials['email'] ?? '')));
        $password = (string) ($credentials['password'] ?? '');

        if ($email === '' || $password === '') {
            return false;
        }

        $user = $this->provider->retrieveByCredentials(['email' => $email]);
        if (! $user || ! ($user->is_active ?? false)) {
            return false;
        }

        return $this->provider->validateCredentials($user, ['password' => $password]);
    }

    public function hasUser(): bool
    {
        return $this->user !== null;
    }

    public function setUser(Authenticatable $user): static
    {
        $this->user = $user;
        $this->resolved = true;

        return $this;
    }

    /**
     * Create a session row for the user and queue the auth cookie.
     * Called through Auth::login().
     */
    public function login(Authenticatable $user): void
    {
        $token = Str::random(64);
        $days = (int) config('bsp.session_days', 14);

        Session::create([
            'user_id' => $user->getAuthIdentifier(),
            'token' => $token,
            'expires_at' => now()->addDays($days),
        ]);

        Cookie::queue(Cookie::make(
            $this->cookieName(),
            $token,
            $days * 24 * 60,
            '/',
            null,
            null,
            true,
            false,
            'lax',
        ));

        $this->setUser($user);
    }

    /**
     * Delete the current session row and forget the cookie.
     * Called through Auth::logout().
     */
    public function logout(): void
    {
        $token = $this->request->cookie($this->cookieName());
        if ($token) {
            Session::where('token', $token)->delete();
        }

        Cookie::queue(Cookie::forget($this->cookieName()));

        $this->user = null;
        $this->resolved = true;
    }

    public function getProvider(): UserProvider
    {
        return $this->provider;
    }

    public function setProvider(UserProvider $provider): void
    {
        $this->provider = $provider;
    }

    protected function cookieName(): string
    {
        return (string) config('bsp.session_cookie', 'bsp_session');
    }
}

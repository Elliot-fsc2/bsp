<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\SiteSettings;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    private const AVATAR_COLORS = ['#2d6a4f', '#40916c', '#c9a227', '#bc6c25', '#1b4332', '#6b705c', '#a68a64'];

    public function showLogin(Request $request): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect($this->safeNext($request->query('next')));
        }

        return view('auth.login', [
            'settings' => SiteSettings::all(),
            'next' => (string) $request->query('next', ''),
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $email = strtolower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');

        if ($email === '' || $password === '') {
            return back()->withInput($request->only('email'))
                ->withErrors(['email' => 'Please add your email and password.']);
        }

        $user = User::query()->where('email', $email)->first();

        if (! $user || ! $user->is_active) {
            return back()->withInput($request->only('email'))
                ->withErrors(['email' => "We couldn't find an active account with that email."]);
        }

        if (! Hash::check($password, $user->password_hash)) {
            return back()->withInput($request->only('email'))
                ->withErrors(['email' => "That password doesn't match. Try laginghanda for demo accounts."]);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        Auth::login($user);

        return redirect($this->safeNext($request->input('next')));
    }

    public function showRegister(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect('/dashboard');
        }

        if (! SiteSettings::all()['allowRegistration']) {
            return redirect()->route('login');
        }

        return view('auth.register', [
            'settings' => SiteSettings::all(),
        ]);
    }

    public function register(Request $request): RedirectResponse
    {
        if (! SiteSettings::all()['allowRegistration']) {
            return redirect()->route('login');
        }

        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');

        if ($name === '' || $email === '' || $password === '') {
            return back()->withInput($request->only('name', 'email'))
                ->withErrors(['name' => 'Name, email, and password are all needed.']);
        }

        if (strlen($password) < 6) {
            return back()->withInput($request->only('name', 'email'))
                ->withErrors(['password' => 'Use at least 6 characters for your password.']);
        }

        if (User::query()->where('email', $email)->exists()) {
            return back()->withInput($request->only('name', 'email'))
                ->withErrors(['email' => 'That email is already part of the council. Try logging in.']);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password_hash' => Hash::make($password),
            'role' => User::ROLE_STUDENT,
            'avatar_color' => self::AVATAR_COLORS[array_rand(self::AVATAR_COLORS)],
            'bio' => 'New Scout on the trail and ready to learn.',
        ]);

        Auth::login($user);

        return redirect('/dashboard');
    }

    public function logout(): RedirectResponse
    {
        Auth::logout();

        return redirect()->route('login');
    }

    /** Only allow same-origin paths, mirroring the original `next` guard. */
    private function safeNext(mixed $next): string
    {
        $next = (string) ($next ?? '');

        if ($next === '' || ! str_starts_with($next, '/') || str_starts_with($next, '//')) {
            return '/dashboard';
        }

        return $next;
    }
}

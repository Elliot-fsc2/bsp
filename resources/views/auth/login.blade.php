@extends('layouts.app')

@section('title', 'Log in — BSP Advancement Portal')

@section('content')
    <div class="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2">
        <div class="hidden md:block">
            <p class="inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">
                {{ $settings['siteName'] }}
            </p>
            <h1 class="mt-6 text-5xl font-semibold leading-tight">Laging Handa! Sign in and continue your Scouting journey.</h1>
            <p class="mt-4 text-lg text-[#52796f]">{{ $settings['tagline'] }}</p>
        </div>
        <div class="rounded-3xl border border-[#dbe7d8] bg-white p-7 md:p-8">
            <p class="mb-4 inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">Welcome back</p>
            <h2 class="text-3xl font-semibold">Log in to the BSP portal</h2>
            <p class="mt-2 mb-6 text-sm text-[#52796f]">Pick a demo account or use your own Scout credentials.</p>

            <form method="POST" action="{{ route('login') }}" class="space-y-4" id="login-form">
                @csrf
                @if ($next !== '')
                    <input type="hidden" name="next" value="{{ $next }}">
                @endif

                <label class="block">
                    <span class="mb-1 block text-sm font-extrabold">Email</span>
                    <input class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2" name="email" type="email" value="{{ old('email') }}" placeholder="you@bsp.org.ph" required>
                </label>
                <label class="block">
                    <span class="mb-1 block text-sm font-extrabold">Password</span>
                    <input class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2" name="password" type="password" placeholder="••••••••" required>
                </label>

                @if ($errors->any())
                    <p class="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{{ $errors->first() }}</p>
                @endif

                <button class="w-full rounded-full bg-[#2d6a4f] px-5 py-3 text-sm font-bold text-white">Enter portal</button>
            </form>

            <div class="mt-4 grid gap-2">
                <p class="text-center text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Demo accounts · password laginghanda</p>
                @foreach ([
                    ['Council Admin', 'admin@bsp.org.ph', 'Ramon · council office'],
                    ['Scout Leader', 'miguel@bsp.org.ph', 'Miguel · outdoor skills'],
                    ['Scout', 'paolo@bsp.org.ph', 'Paolo · badge trail'],
                ] as [$label, $email, $note])
                    <button
                        type="button"
                        class="flex w-full items-center justify-between rounded-full border border-[#dbe7d8] bg-white px-3 py-2 text-sm font-bold"
                        data-demo-email="{{ $email }}"
                    >
                        <span>{{ $label }}</span>
                        <span class="text-[#52796f]">{{ $note }}</span>
                    </button>
                @endforeach
            </div>

            <p class="mt-4 text-center text-sm font-bold text-[#52796f]">
                New here? <a href="{{ route('register') }}" class="text-[#1d4e89]">Create an account</a>
            </p>
        </div>
    </div>

    <script>
        document.querySelectorAll('[data-demo-email]').forEach(function (button) {
            button.addEventListener('click', function () {
                var form = document.getElementById('login-form');
                form.querySelector('input[name="email"]').value = button.dataset.demoEmail;
                form.querySelector('input[name="password"]').value = 'laginghanda';
            });
        });
    </script>
@endsection

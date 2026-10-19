@extends('layouts.app')

@section('title', 'Create account — BSP Advancement Portal')

@section('content')
    <div class="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2">
        <div>
            <p class="inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">
                {{ $settings['siteName'] }}
            </p>
            <h1 class="mt-6 text-5xl font-semibold leading-tight">Join the Scouting movement.</h1>
            <p class="mt-4 text-lg text-[#52796f]">New members join as Scouts. Scout Leaders and Council Admins are invited by the council office.</p>
        </div>
        <div class="rounded-3xl border border-[#dbe7d8] bg-white p-7 md:p-8">
            <h2 class="text-3xl font-semibold">Create account</h2>
            <p class="mt-2 mb-6 text-sm text-[#52796f]">It takes less time than tying a square knot.</p>

            <form method="POST" action="{{ route('register') }}" class="space-y-4">
                @csrf
                <label class="block">
                    <span class="mb-1 block text-sm font-extrabold">Name</span>
                    <input class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2" name="name" value="{{ old('name') }}" placeholder="Your name" required>
                </label>
                <label class="block">
                    <span class="mb-1 block text-sm font-extrabold">Email</span>
                    <input class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2" name="email" type="email" value="{{ old('email') }}" placeholder="you@bsp.org.ph" required>
                </label>
                <label class="block">
                    <span class="mb-1 block text-sm font-extrabold">Password</span>
                    <input class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2" name="password" type="password" minlength="6" required>
                </label>

                @if ($errors->any())
                    <p class="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{{ $errors->first() }}</p>
                @endif

                <button class="w-full rounded-full bg-[#2d6a4f] px-5 py-3 text-sm font-bold text-white">Create my account</button>
            </form>

            <p class="mt-4 text-center text-sm font-bold text-[#52796f]">
                Already a member? <a href="{{ route('login') }}" class="text-[#1d4e89]">Log in</a>
            </p>
        </div>
    </div>
@endsection

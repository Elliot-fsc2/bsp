@extends('layouts.app')

@section('title', $settings['siteName'].' — '.$settings['tagline'])

@section('content')
    <header class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <div class="flex items-center gap-3">
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-[#d8f3dc] text-2xl">&#9873;</span>
            <div>
                <p class="text-xl font-semibold leading-none">{{ $settings['siteName'] }}</p>
                <p class="text-xs font-bold text-[#52796f]">{{ $settings['tagline'] }}</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            @auth
                <a href="{{ route('dashboard') }}" class="rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white">Open portal</a>
            @else
                <a href="{{ route('login') }}" class="rounded-full border-2 border-[#2d6a4f] px-4 py-2 text-sm font-bold text-[#2d6a4f]">Log in</a>
                <a href="{{ route('register') }}" class="hidden rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white sm:inline-flex">Join free</a>
            @endauth
        </div>
    </header>

    <section class="mx-auto grid max-w-6xl items-center gap-10 px-5 py-8 md:grid-cols-2 md:py-14">
        <div>
            <p class="mb-4 inline-flex items-center gap-2 rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">
                Laging Handa — always prepared
            </p>
            <h1 class="text-4xl font-semibold leading-tight sm:text-6xl">
                Earn your ranks and merit badges, one requirement at a time.
            </h1>
            <p class="mt-5 max-w-lg text-lg text-[#52796f]">{{ $settings['welcomeMessage'] }}</p>
            <div class="mt-7 flex flex-wrap gap-3">
                <a href="{{ auth()->check() ? route('dashboard') : route('register') }}" class="rounded-full bg-[#2d6a4f] px-5 py-3 text-sm font-bold text-white">Start the trail</a>
                <a href="{{ route('login') }}" class="rounded-full border-2 border-[#2d6a4f] px-5 py-3 text-sm font-bold text-[#2d6a4f]">Try a demo account</a>
            </div>
            <div class="mt-8 flex flex-wrap gap-2 text-xs font-bold text-[#1b4332]">
                <span class="rounded-full bg-white px-3 py-1">{{ $programs->count() }} programs</span>
                <span class="rounded-full bg-white px-3 py-1">{{ $badgeCount }} badges</span>
                <span class="rounded-full bg-white px-3 py-1">Video &amp; photo proof</span>
            </div>
        </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 pb-16">
        <div class="mb-6">
            <p class="text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Scouting programs</p>
            <h2 class="mt-2 text-3xl font-semibold">Choose where you belong</h2>
        </div>
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            @foreach ($programs as $program)
                <article class="overflow-hidden rounded-3xl border border-[#dbe7d8] bg-white">
                    <div class="flex h-24 items-center justify-center text-4xl" style="background: {{ $program->color }}33">
                        {{ $program->icon }}
                    </div>
                    <div class="p-4">
                        <p class="text-xs font-extrabold uppercase tracking-wide text-[#52796f]">{{ $program->age_range }}</p>
                        <h3 class="mt-1 text-xl font-semibold leading-tight">{{ $program->name }}</h3>
                        <p class="mt-2 text-sm text-[#52796f]">{{ $program->description }}</p>
                    </div>
                </article>
            @endforeach
        </div>
    </section>
@endsection

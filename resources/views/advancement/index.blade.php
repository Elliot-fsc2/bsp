@extends('layouts.campus')

@section('title', 'Advancement — BSP Advancement Portal')

@section('content')
    <x-page-header
        eyebrow="Advancement"
        title="Your trail to the top"
        text="Choose a program, complete each requirement, and submit your proof. Every requirement needs two approvals: a Scout Leader, then a Council Admin."
    >
        <x-slot:action>
            <a href="{{ route('advancement.mine') }}" class="rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white">🧭 What's left to do</a>
            <a href="{{ route('advancement.merit-badges') }}" class="rounded-full border-2 border-[#2d6a4f] px-4 py-2 text-sm font-bold text-[#2d6a4f]">🎖️ Browse merit badges</a>
        </x-slot:action>
    </x-page-header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @foreach ([
            ['Badges earned', $awarded->count()],
            ['In progress', $inProgressCount],
            ['Ready to submit', count($readyToApply)],
            ['Programs', count($programs)],
        ] as [$label, $value])
            <div class="rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <p class="text-sm font-bold text-[#52796f]">{{ $label }}</p>
                <p class="text-3xl font-semibold">{{ $value }}</p>
            </div>
        @endforeach
    </div>

    @if (count($readyToApply) > 0)
        <section class="mb-6">
            <h2 class="mb-3 text-2xl font-semibold">Ready to submit for approval</h2>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                @foreach ($readyToApply as $badge)
                    <x-badge-card :badge="$badge" />
                @endforeach
            </div>
        </section>
    @endif

    @if ($awarded->count() > 0)
        <section class="mb-6">
            <h2 class="mb-3 text-2xl font-semibold">Earned badges</h2>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                @foreach ($awarded as $row)
                    <a href="{{ route('advancement.badge', $row->badge_id) }}" class="flex items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-4">
                        @if ($row->badge?->image_url)
                            <img src="{{ $row->badge->image_url }}" alt="" class="h-14 w-14">
                        @else
                            <span class="text-3xl">🎖️</span>
                        @endif
                        <div>
                            <p class="font-extrabold">{{ $row->badge?->name }}</p>
                            <p class="text-xs font-bold text-[#52796f]">{{ $row->badge?->program?->name }}</p>
                        </div>
                    </a>
                @endforeach
            </div>
        </section>
    @endif

    @foreach ($programs as $program)
        @php
            $ranks = collect($badges)
                ->filter(fn ($b) => $b['programId'] === $program['id'] && $b['kind'] === 'rank')
                ->sortBy([['position', 'asc'], ['id', 'asc']])
                ->values()
                ->all();
        @endphp
        <section class="mb-8 {{ $program['locked'] ? 'opacity-80' : '' }}">
            <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <p class="mb-2 flex flex-wrap items-center gap-2">
                        <span class="rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">Level {{ $program['level'] }}</span>
                        @if ($program['complete'])
                            <span class="rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold">Program complete</span>
                        @endif
                        @if ($program['locked'])
                            <span class="rounded-full bg-[#ffe0e8] px-3 py-1 text-xs font-extrabold">🔒 Locked</span>
                        @endif
                    </p>
                    <h2 class="text-2xl font-semibold">{{ $program['icon'] }} {{ $program['name'] }}</h2>
                    <p class="text-sm text-[#52796f]">{{ $program['ageRange'] }} · {{ $program['ranksEarned'] }}/{{ $program['ranksTotal'] }} ranks earned</p>
                </div>
                @unless ($program['locked'])
                    <a href="{{ route('advancement.program', $program['slug']) }}" class="text-sm font-extrabold text-[#1d4e89]">Program details →</a>
                @endunless
            </div>

            @if ($program['locked'])
                <p class="mb-3 rounded-3xl border border-[#dbe7d8] bg-white p-3 text-sm font-bold text-[#52796f]">
                    🔒 Level {{ $program['level'] }} opens when you finish <strong>{{ $program['lockedByName'] }}</strong>. You can see the trail ahead, but it is not open yet.
                </p>
            @endif

            <h3 class="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Ranks — earn them in order</h3>
            <x-rank-ladder :ranks="$ranks" :disabled="$program['locked']" />
        </section>
    @endforeach
@endsection

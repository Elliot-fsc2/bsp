@extends('layouts.campus')

@section('title', 'Merit badges — BSP Advancement Portal')

@section('content')
    @php
        $letter = strtoupper((string) request('letter'));
        $query = trim((string) request('q'));
        $programFilter = (string) request('program');

        $filtered = collect($badges)->filter(function (array $b) use ($letter, $query, $programFilter) {
            if ($letter !== '' && ! str_starts_with(mb_strtoupper($b['name']), $letter)) {
                return false;
            }
            if ($query !== '' && ! str_contains(mb_strtolower($b['name'].' '.($b['description'] ?? '')), mb_strtolower($query))) {
                return false;
            }
            if ($programFilter !== '' && (string) $b['programId'] !== $programFilter) {
                return false;
            }

            return true;
        })->values()->all();
    @endphp

    <x-page-header
        eyebrow="Catalogue"
        title="🎖️ Merit badges"
        text="Merit badges are earned on their own — they are not part of a rank ladder. Browse the catalogue, open a badge, and work through its requirements."
    />

    <form method="GET" action="{{ route('advancement.merit-badges') }}" class="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" value="{{ $query }}" placeholder="Search badges…" class="rounded-2xl border border-[#cfe0cb] px-3 py-2 text-sm">
        <select name="program" class="rounded-2xl border border-[#cfe0cb] px-3 py-2 text-sm">
            <option value="">All programs</option>
            @foreach ($programs as $program)
                <option value="{{ $program['id'] }}" @selected($programFilter === (string) $program['id'])>{{ $program['icon'] }} {{ $program['name'] }}</option>
            @endforeach
        </select>
        <button class="rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white">Filter</button>
        @if ($letter !== '' || $query !== '' || $programFilter !== '')
            <a href="{{ route('advancement.merit-badges') }}" class="text-sm font-bold text-[#1d4e89]">Clear</a>
        @endif
    </form>

    <div class="mb-5 flex flex-wrap gap-1">
        <a href="{{ route('advancement.merit-badges', array_filter(['q' => $query, 'program' => $programFilter])) }}" class="rounded-full px-3 py-1 text-xs font-extrabold {{ $letter === '' ? 'bg-[#2d6a4f] text-white' : 'bg-white' }}">All</a>
        @foreach (range('A', 'Z') as $letterOption)
            <a href="{{ route('advancement.merit-badges', array_filter(['letter' => $letterOption, 'q' => $query, 'program' => $programFilter])) }}"
               class="rounded-full px-3 py-1 text-xs font-extrabold {{ $letter === $letterOption ? 'bg-[#2d6a4f] text-white' : 'bg-white' }}">{{ $letterOption }}</a>
        @endforeach
    </div>

    @if (count($filtered) === 0)
        <p class="rounded-3xl border border-[#dbe7d8] bg-white p-6 text-[#52796f]">No merit badges match that filter.</p>
    @else
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            @foreach ($filtered as $badge)
                <x-badge-card :badge="$badge" />
            @endforeach
        </div>
    @endif
@endsection

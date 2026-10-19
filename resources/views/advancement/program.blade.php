@extends('layouts.campus')

@section('title', $program->name.' — BSP Advancement Portal')

@section('content')
    <x-page-header :eyebrow="$program->section ?? 'Scouting program'" :title="$program->icon.' '.$program->name" :text="$program->age_range" />

    <div class="mb-6 max-w-3xl text-[#52796f]">
        <x-rich-text :value="$program->description" />
    </div>

    @if ($locked)
        <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold">
            🔒 This is level {{ $entry['level'] ?? '' }} of your advancement trail and it is not open yet. Finish
            <strong>{{ $entry['lockedByName'] ?? '' }}</strong> first — you can look at the trail ahead, but you cannot start it yet.
        </p>
    @endif

    <section class="mb-8">
        <h2 class="mb-1 text-2xl font-semibold">Rank ladder</h2>
        <p class="mb-3 text-sm text-[#52796f]">Ranks are earned in order. The next rank stays locked until you finish the one before it.</p>
        <x-rank-ladder :ranks="$ranks" :disabled="$locked" />
    </section>

    @unless ($locked)
        <p class="rounded-3xl border border-[#dbe7d8] bg-white p-5 text-sm">
            🎖️ Merit badges are separate from the rank ladder and can be earned in any order.
            <a href="{{ route('advancement.merit-badges') }}" class="font-extrabold text-[#1d4e89]">Browse all merit badges →</a>
        </p>
    @endunless
@endsection

@extends('layouts.campus')

@section('title', 'My advancement — BSP Advancement Portal')

@section('content')
    <x-page-header
        eyebrow="My advancement"
        title="My advancement"
        text="What you still need to do, and every task you have sent for approval. Tap any task to open its details."
    />

    <x-advancement-timeline :programs="$programs" :badges="$badges" />

    <h2 class="mb-3 text-2xl font-semibold">My submissions</h2>
    @if ($submissions->isEmpty())
        <p class="rounded-3xl border border-[#dbe7d8] bg-white p-6 text-[#52796f]">Nothing submitted yet. Open a badge and start with your first requirement.</p>
    @else
        <div class="space-y-3">
            @foreach ($submissions as $item)
                @php
                    $href = $item->requirement_id
                        ? route('advancement.requirement', $item->requirement_id)
                        : route('advancement.badge', $item->badge_id);
                    $title = $item->requirement?->title ?? ($item->badge?->name.' — badge application');
                @endphp
                <a href="{{ $href }}" class="flex flex-wrap items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-4">
                    @if ($item->badge?->image_url)
                        <img src="{{ $item->badge->image_url }}" alt="" class="h-11 w-11">
                    @else
                        <span class="text-2xl">🎖️</span>
                    @endif
                    <div class="min-w-0 flex-1">
                        <p class="font-extrabold">{{ $title }}</p>
                        <p class="text-xs text-[#52796f]">{{ $item->badge?->name }} · submitted {{ format_datetime($item->submitted_at) }}</p>
                    </div>
                    <x-status-sticker :status="$item->status" />
                </a>
            @endforeach
        </div>
    @endif
@endsection

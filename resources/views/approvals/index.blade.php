@extends('layouts.campus')

@section('title', 'Approvals — BSP Advancement Portal')

@section('content')
    <x-page-header
        eyebrow="Approvals"
        title="Advancement approvals"
        text="Every answer the Scout sent is shown below — written work, video or photo proof, Drive files, and quiz answers. Two approvals complete a task: a Scout Leader (level 1), then a Council Admin (level 2)."
    />

    <section class="mb-8">
        <h2 class="mb-3 text-2xl font-semibold">Waiting for you ({{ $pending->count() }})</h2>
        @if ($pending->isEmpty())
            <p class="rounded-3xl border border-[#dbe7d8] bg-white p-6 text-[#52796f]">Inbox zero — nothing waiting for your approval.</p>
        @else
            <div class="space-y-4">
                @foreach ($pending as $item)
                    @php
                        $questions = json_decode($item->requirement?->quiz_json ?? '[]', true) ?: [];
                    @endphp
                    <article class="rounded-3xl border border-[#dbe7d8] bg-white p-4">
                        <div class="flex flex-wrap items-center gap-3">
                            @if ($item->badge?->image_url)
                                <img src="{{ $item->badge->image_url }}" alt="" class="h-12 w-12">
                            @else
                                <span class="text-2xl">🎖️</span>
                            @endif
                            <x-avatar :name="$item->user->name" :color="$item->user->avatar_color" :size="36" />
                            <div class="min-w-0 flex-1">
                                <p class="font-extrabold">{{ $item->requirement?->title ?? ($item->badge?->name.' — badge application') }}</p>
                                <p class="text-xs text-[#52796f]">{{ $item->user->name }} · {{ $item->badge?->name }} · submitted {{ relative_time($item->submitted_at) }}</p>
                            </div>
                            <x-status-sticker :status="$item->status" />
                            <a href="{{ route('approvals.show', $item->id) }}" class="rounded-full border-2 border-[#2d6a4f] px-4 py-2 text-sm font-bold text-[#2d6a4f]">Review &amp; decide →</a>
                        </div>

                        <div class="mt-3 rounded-2xl border border-[#eef5ec] bg-white/60 p-3">
                            <x-submission-responses :answer="$item" :questions="$questions" compact />
                        </div>
                    </article>
                @endforeach
            </div>
        @endif
    </section>

    <section>
        <h2 class="mb-3 text-2xl font-semibold">Recently decided</h2>
        @if ($decided->isEmpty())
            <p class="rounded-3xl border border-[#dbe7d8] bg-white p-6 text-[#52796f]">Nothing decided yet.</p>
        @else
            <div class="space-y-2">
                @foreach ($decided as $item)
                    <a href="{{ route('approvals.show', $item->id) }}" class="flex flex-wrap items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-3">
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-extrabold">{{ $item->requirement?->title ?? ($item->badge?->name.' — badge application') }}</p>
                            <p class="text-xs text-[#52796f]">{{ $item->user->name }} · {{ $item->badge?->name }}</p>
                        </div>
                        <x-status-sticker :status="$item->status" />
                        <span class="text-xs font-bold text-[#52796f]">{{ format_datetime($item->decided_at) }}</span>
                    </a>
                @endforeach
            </div>
        @endif
    </section>
@endsection

@extends('layouts.campus')

@section('title', $requirement->title.' — BSP Advancement Portal')

@section('content')
    @php
        $approved = $submission?->status === 'approved';
        $questions = json_decode($requirement->quiz_json ?? '[]', true) ?: [];
    @endphp

    <div class="mx-auto max-w-3xl">
        <div class="mb-4">
            <a href="{{ route('advancement.badge', $requirement->badge_id) }}" class="text-sm font-extrabold text-[#1d4e89]">← {{ $badge?->name ?? 'Back to badge' }}</a>
        </div>

        <x-page-header
            :eyebrow="$requirement->type === 'merit' ? 'Badge requirement' : $requirement->points.' points'"
            :title="$requirement->title"
            :text="$requirement->description"
        />

        @if ($requirement->instructions)
            <article class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <h2 class="mb-2 text-xl font-semibold">What to do</h2>
                <x-rich-text :value="$requirement->instructions" />
            </article>
        @endif

        @if ($programLock['locked'])
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold">
                🔒 {{ $badge?->name ?? 'This program' }} is part of level {{ $programLock['level'] }}, which is still locked. Finish
                <strong>{{ $programLock['lockedByName'] }}</strong> first, then come back to this task.
            </p>
        @elseif ($lock['locked'])
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold">
                🔒 This rank is locked. Finish the <strong>{{ $lock['lockedByName'] }}</strong> first, then come back to this task.
            </p>
        @elseif ($approved)
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold text-[#2d6a4f]">✅ This requirement is approved. Great work, Scout.</p>
        @elseif ($requirement->type === 'merit')
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold">
                This requirement is met by earning the required merit badge.
                @if ($requirement->required_badge_id)
                    <a href="{{ route('advancement.badge', $requirement->required_badge_id) }}" class="text-[#1d4e89] underline">Open the badge →</a>
                @endif
            </p>
        @else
            <div class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <livewire:advancement.requirement-form :requirement-id="$requirement->id" />
            </div>
        @endif

        @if ($submission && ($submission->media_url || $submission->external_url || $submission->text_content))
            <article class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <h2 class="mb-2 text-xl font-semibold">Your submission</h2>
                <x-submission-responses :answer="$submission" :questions="$questions" />
            </article>
        @endif

        <h2 class="mb-3 text-2xl font-semibold">Approvals</h2>
        @if ($approvals->isEmpty())
            <p class="rounded-3xl border border-[#dbe7d8] bg-white p-5 text-[#52796f]">No approvals yet. Level 1 is a Scout Leader; level 2 is a Council Admin.</p>
        @else
            <div class="space-y-3">
                @foreach ($approvals as $approval)
                    <article class="flex items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-4">
                        <x-avatar :name="$approval->approver->name ?? '?'" :color="$approval->approver->avatar_color ?? '#2d6a4f'" :size="40" />
                        <div class="min-w-0 flex-1">
                            <p class="font-extrabold">
                                {{ $approval->approver->name ?? 'Reviewer' }}
                                <span class="text-xs font-bold text-[#52796f]">Level {{ $approval->level }}</span>
                            </p>
                            <p class="text-sm text-[#52796f]">{{ $approval->comment ?? 'No comment.' }}</p>
                        </div>
                        <span class="rounded-full px-3 py-1 text-xs font-extrabold {{ $approval->decision === 'approved' ? 'bg-[#d8f3dc]' : 'bg-[#ffe0e8]' }}">{{ $approval->decision }}</span>
                        <span class="text-xs font-bold text-[#52796f]">{{ format_datetime($approval->created_at) }}</span>
                    </article>
                @endforeach
            </div>
        @endif
    </div>
@endsection

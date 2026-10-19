@extends('layouts.campus')

@section('title', 'Review submission — BSP Advancement Portal')

@section('content')
    @php
        $questions = json_decode($requirement?->quiz_json ?? '[]', true) ?: [];
    @endphp

    <div class="mx-auto max-w-3xl">
        <div class="mb-4">
            <a href="{{ route('approvals.index') }}" class="text-sm font-extrabold text-[#1d4e89]">← Back to approvals</a>
        </div>

        <x-page-header
            :eyebrow="$badge ? ($badge->name.($requirement ? ' · '.$requirement->title : ' · badge application')) : 'Submission'"
            :title="$submission->user->name.'\'s submission'"
            :text="'Submitted '.format_datetime($submission->submitted_at)"
        />

        <article class="mb-5 flex items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-5">
            <x-avatar :name="$submission->user->name" :color="$submission->user->avatar_color" :size="48" />
            <div>
                <p class="font-extrabold">{{ $submission->user->name }}</p>
                <p class="text-xs text-[#52796f]">{{ $submission->user->email }}</p>
            </div>
            <span class="ml-auto rounded-full bg-[#f3f7f1] px-3 py-1 text-xs font-extrabold">
                Level {{ $waitingLevel }} · {{ $waitingLevel === 1 ? 'Scout Leader' : 'Council Admin' }}
            </span>
        </article>

        <article class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5">
            <h2 class="mb-3 text-xl font-semibold">What the Scout submitted</h2>
            <x-submission-responses :answer="$submission" :questions="$questions" />
        </article>

        <h2 class="mb-3 text-2xl font-semibold">Approval history</h2>
        @if ($approvals->isEmpty())
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 text-[#52796f]">No decisions recorded yet.</p>
        @else
            <div class="mb-5 space-y-2">
                @foreach ($approvals as $approval)
                    <div class="flex items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-3">
                        <x-avatar :name="$approval->approver->name ?? '?'" :color="$approval->approver->avatar_color ?? '#2d6a4f'" :size="34" />
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-extrabold">{{ $approval->approver->name ?? 'Reviewer' }} · Level {{ $approval->level }}</p>
                            <p class="text-xs text-[#52796f]">{{ $approval->comment ?? 'No comment.' }}</p>
                        </div>
                        <span class="rounded-full px-3 py-1 text-xs font-extrabold {{ $approval->decision === 'approved' ? 'bg-[#d8f3dc]' : 'bg-[#ffe0e8]' }}">{{ $approval->decision }}</span>
                    </div>
                @endforeach
            </div>
        @endif

        @if ($canDecide)
            <div class="rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <h2 class="mb-3 text-2xl font-semibold">Your decision</h2>
                <livewire:approvals.decision-panel :submission-id="$submission->id" />
            </div>
        @else
            <p class="rounded-3xl border border-[#dbe7d8] bg-white p-5 text-[#52796f]">
                This submission is not waiting for you (already decided, or it is the other level's turn).
            </p>
        @endif
    </div>
@endsection

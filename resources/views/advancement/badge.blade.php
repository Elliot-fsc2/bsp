@extends('layouts.campus')

@section('title', $badge['name'].' — BSP Advancement Portal')

@section('content')
    @php
        $statusLabel = fn ($s) => match ($s) {
            'pending' => 'Waiting for Scout Leader',
            'level1_approved' => 'Waiting for Council Admin',
            'approved' => 'Approved',
            'rejected' => 'Needs revision',
            default => 'Not started',
        };
        $statusStyle = fn ($s) => match ($s) {
            'pending' => 'bg-[#fff3c4]',
            'level1_approved' => 'bg-[#dbeafe]',
            'approved' => 'bg-[#d8f3dc]',
            'rejected' => 'bg-[#ffe0e8]',
            default => 'bg-white',
        };
    @endphp

    <div class="mx-auto max-w-4xl">
        <div class="mb-4">
            <a href="{{ route('advancement.index') }}" class="text-sm font-extrabold text-[#1d4e89]">← Back to advancement</a>
        </div>

        <section class="mb-5 flex flex-wrap items-center gap-5 rounded-3xl border border-[#dbe7d8] bg-white p-6">
            @if ($badge['imageUrl'])
                <img src="{{ $badge['imageUrl'] }}" alt="" class="h-24 w-24">
            @else
                <span class="grid h-20 w-20 place-items-center rounded-full text-4xl" style="background: {{ $badge['programColor'] }}">
                    {{ $badge['kind'] === 'merit' ? '🎖️' : '⚜️' }}
                </span>
            @endif

            <div class="min-w-0 flex-1">
                <p class="mb-2 inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">
                    {{ $badge['programIcon'] }} {{ $badge['programName'] }} · {{ $badge['kind'] === 'merit' ? 'Merit badge' : 'Rank' }}@if (! is_null($badge['rankStep'])) {{ $badge['rankStep'] }} of {{ $badge['rankCount'] }}@endif@if ($badge['isMembership']) · Membership @endif
                </p>
                <h1 class="text-3xl font-semibold">{{ $badge['name'] }}</h1>
                <p class="mt-1 text-sm text-[#52796f]">{{ $badge['description'] }}</p>
                <div class="mt-3 flex items-center gap-3">
                    <div class="h-2 w-56 overflow-hidden rounded-full bg-[#eef5ec]">
                        <div class="h-full bg-[#2d6a4f]" style="width: {{ $badge['percent'] }}%"></div>
                    </div>
                    <span class="text-sm font-extrabold">{{ $badge['satisfiedCount'] }}/{{ $badge['totalCount'] }} requirements</span>
                </div>
            </div>

            @if ($badge['earned'])
                <div class="rounded-2xl bg-[#d8f3dc] px-4 py-3 text-center">
                    <p class="text-2xl">🏅</p>
                    <p class="text-sm font-extrabold">Earned</p>
                    <p class="text-xs text-[#52796f]">{{ $badge['awardedAt'] ? format_date($badge['awardedAt']) : '' }}</p>
                </div>
            @endif
        </section>

        @if ($locked)
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold">
                @if ($programLock['locked'])
                    🔒 {{ $badge['programName'] }} is level {{ $programLock['level'] }} and is still locked. Finish
                    <strong>{{ $programLock['lockedByName'] }}</strong> first, then come back to this rank.
                @else
                    🔒 This rank is locked. Finish the <strong>{{ $badge['lockedByName'] }}</strong> first, then come back to this one.
                @endif
            </p>
        @elseif ($badge['earned'])
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold text-[#2d6a4f]">⚜️ This badge is on your record. Congratulations, Scout!</p>
        @elseif ($badge['canApply'])
            <form method="POST" action="{{ route('advancement.badge.apply', $badge['id']) }}" class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-5">
                @csrf
                <div>
                    <p class="text-xl font-semibold">All requirements complete!</p>
                    <p class="text-sm text-[#52796f]">Submit this badge for approval. It needs a Scout Leader and a Council Admin.</p>
                </div>
                <button class="rounded-full bg-[#2d6a4f] px-5 py-3 text-sm font-bold text-white">Submit badge for approval</button>
            </form>
        @elseif (in_array($badge['applicationStatus'], ['pending', 'level1_approved'], true))
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold">⏳ {{ $statusLabel($badge['applicationStatus']) }} — your badge application is in review.</p>
        @elseif ($badge['applicationStatus'] === 'rejected')
            <p class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5 font-bold text-[#c9184a]">✗ Your badge application needs revision. Submit it again when ready.</p>
        @endif

        @if (count($badge['requiredBy']))
            <section class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <h2 class="mb-1 text-xl font-semibold">Required by</h2>
                <p class="mb-3 text-sm text-[#52796f]">These ranks need this merit badge before they can be completed — it is one of their requirements.</p>
                <div class="flex flex-wrap gap-2">
                    @foreach ($badge['requiredBy'] as $rank)
                        <a href="{{ route('advancement.badge', $rank['id']) }}" class="rounded-full bg-[#f3f7f1] px-3 py-1 text-sm font-bold">
                            ⚜️ {{ $rank['name'] }} <span class="text-[#52796f]">· {{ $rank['programName'] }}</span>
                        </a>
                    @endforeach
                </div>
            </section>
        @endif

        <h2 class="mb-3 text-2xl font-semibold">Requirements</h2>
        <div class="space-y-3">
            @foreach ($badge['requirements'] as $index => $requirement)
                <article class="rounded-3xl border border-[#dbe7d8] bg-white p-5">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Requirement {{ $index + 1 }} · {{ $requirement['points'] }} pts</p>
                            <h3 class="text-xl font-semibold">{{ $requirement['title'] }}</h3>
                            @if ($requirement['description'])
                                <p class="mt-1 text-sm text-[#52796f]">{{ $requirement['description'] }}</p>
                            @endif
                            <div class="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold">
                                @if ($requirement['type'] === 'merit')
                                    <span class="rounded-full bg-[#f3f7f1] px-2 py-0.5">🎖️ Earn a merit badge</span>
                                @endif
                                @if ($requirement['requiresText'])
                                    <span class="rounded-full bg-[#f3f7f1] px-2 py-0.5">✍️ Written answer</span>
                                @endif
                                @if ($requirement['requiresMedia'])
                                    <span class="rounded-full bg-[#f3f7f1] px-2 py-0.5">{{ $requirement['mediaKind'] === 'video' ? '🎥 Video proof' : '📷 Photo proof' }}</span>
                                @endif
                                @if ($requirement['requiresLink'])
                                    <span class="rounded-full bg-[#f3f7f1] px-2 py-0.5">🔗 Drive link</span>
                                @endif
                                @if ($requirement['quiz'])
                                    <span class="rounded-full bg-[#f3f7f1] px-2 py-0.5">❓ Quiz</span>
                                @endif
                            </div>
                        </div>

                        <div class="flex flex-col items-end gap-2">
                            <span class="rounded-full px-3 py-1 text-xs font-extrabold {{ $statusStyle($requirement['status']) }}">
                                {{ $requirement['satisfied'] ? 'Completed' : $statusLabel($requirement['status']) }}
                            </span>

                            @if ($requirement['satisfiedByMerit'] && $requirement['requiredBadgeId'])
                                <a href="{{ route('advancement.badge', $requirement['requiredBadgeId']) }}" class="rounded-full border-2 border-[#2d6a4f] px-4 py-2 text-sm font-bold text-[#2d6a4f]">View {{ $requirement['requiredBadgeName'] }}</a>
                            @elseif ($requirement['satisfied'])
                                <span class="text-sm font-extrabold text-[#2d6a4f]">✓ Done</span>
                            @elseif ($requirement['type'] === 'merit' && $requirement['requiredBadgeId'])
                                <a href="{{ route('advancement.badge', $requirement['requiredBadgeId']) }}" class="rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white">Earn {{ $requirement['requiredBadgeName'] }}</a>
                            @elseif ($locked)
                                <span class="rounded-full bg-[#f3f7f1] px-3 py-1 text-xs font-extrabold opacity-60">🔒 Locked</span>
                            @else
                                <a href="{{ route('advancement.requirement', $requirement['id']) }}" class="rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white">▶ Proceed</a>
                            @endif
                        </div>
                    </div>

                    @if ($requirement['instructions'] && ! $requirement['satisfied'])
                        <details class="mt-3">
                            <summary class="cursor-pointer text-sm font-extrabold text-[#1d4e89]">What to do</summary>
                            <div class="mt-2 text-sm">
                                <x-rich-text :value="$requirement['instructions']" />
                            </div>
                        </details>
                    @endif
                </article>
            @endforeach
        </div>
    </div>
@endsection

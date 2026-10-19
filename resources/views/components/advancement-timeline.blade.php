@props(['programs' => [], 'badges' => []])

@if (count($programs) > 0)
    @php
        $current = null;
        foreach ($programs as $p) {
            if (! $p['locked'] && ! $p['complete']) { $current = $p; break; }
        }
        if (! $current) {
            foreach (array_reverse($programs) as $p) {
                if (! $p['locked']) { $current = $p; break; }
            }
        }
        $current ??= $programs[0];

        $ranks = collect($badges)
            ->filter(fn ($b) => $b['programId'] === $current['id'] && $b['kind'] === 'rank')
            ->sortBy([['position', 'asc'], ['id', 'asc']])
            ->values();
        $tasks = $ranks->flatMap(fn ($r) => $r['requirements']);
        $done = $tasks->filter(fn ($t) => $t['satisfied'])->count();
        $percent = $tasks->count() ? (int) round($done / $tasks->count() * 100) : 0;
        $lockedNext = collect($programs)->first(fn ($p) => $p['locked']);

        $statuses = [
            'done' => ['Approved', 'bg-[#d8f3dc]'],
            'merit' => ['Merit badge earned', 'bg-[#d8f3dc]'],
            'leader' => ['Waiting for Scout Leader', 'bg-[#fff3c4]'],
            'council' => ['Waiting for Council Admin', 'bg-[#dbeafe]'],
            'revise' => ['Needs revision', 'bg-[#ffe0e8]'],
            'todo' => ['To do', 'bg-white'],
            'locked' => ['Locked', 'bg-white opacity-70'],
        ];
        $toneOf = function (array $req, bool $locked) {
            if ($req['satisfiedByMerit']) return 'merit';
            if ($req['satisfied']) return 'done';
            if ($req['status'] === 'rejected') return 'revise';
            if ($req['status'] === 'level1_approved') return 'council';
            if ($req['status'] === 'pending') return 'leader';
            if ($locked) return 'locked';
            return 'todo';
        };
        $rankTone = function (array $rank) {
            if ($rank['earned']) return 'Earned';
            if ($rank['locked']) return 'Locked — earn the '.$rank['lockedByName'].' first';
            if ($rank['canApply']) return 'Ready to submit for approval';
            if ($rank['satisfiedCount'] > 0) return 'In progress';
            return 'Not started';
        };
    @endphp

    <section class="mb-5 rounded-3xl border border-[#dbe7d8] bg-white p-4 md:p-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <p class="mb-2 inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">
                    Level {{ $current['level'] }} · {{ $current['icon'] }} {{ $current['name'] }}
                </p>
                <h2 class="text-2xl font-semibold">What you still need to do</h2>
                <p class="text-sm text-[#52796f]">
                    {{ $done }} of {{ $tasks->count() }} tasks done · {{ $current['ranksEarned'] }}/{{ $current['ranksTotal'] }} ranks earned
                </p>
            </div>
            <a href="{{ route('advancement.program', $current['slug']) }}" class="text-sm font-extrabold text-[#1d4e89]">Open the program →</a>
        </div>

        <div class="mt-3 h-2 overflow-hidden rounded-full bg-[#eef5ec]">
            <div class="h-full bg-[#2d6a4f]" style="width: {{ $percent }}%"></div>
        </div>

        @if ($tasks->count() === 0)
            <p class="mt-4 text-sm text-[#52796f]">This program has no tasks yet. Check back soon, Scout.</p>
        @else
            <ol class="relative mt-5 space-y-6 border-l-2 border-[#eef5ec] pl-4 md:pl-6">
                @foreach ($ranks as $index => $rank)
                    <li class="relative">
                        <span class="absolute -left-[26px] top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[#eef5ec] text-[10px] font-extrabold md:-left-[34px] {{ $rank['earned'] ? 'bg-[#d8f3dc]' : 'bg-white' }}">
                            {{ $rank['earned'] ? '✓' : $index + 1 }}
                        </span>

                        <div class="flex flex-wrap items-center gap-2">
                            @if ($rank['locked'])
                                <span class="font-extrabold opacity-60">{{ $rank['name'] }}</span>
                            @else
                                <a href="{{ route('advancement.badge', $rank['id']) }}" class="font-extrabold text-[#1d4e89] underline">{{ $rank['name'] }}</a>
                            @endif
                            <span class="rounded-full bg-[#f3f7f1] px-2 py-0.5 text-[10px] font-extrabold">{{ $rank['satisfiedCount'] }}/{{ $rank['totalCount'] }} tasks</span>
                            <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold {{ $rank['earned'] ? 'bg-[#d8f3dc]' : ($rank['canApply'] ? 'bg-[#dbeafe]' : ($rank['locked'] ? 'bg-white opacity-70' : 'bg-white')) }}">
                                {{ $rankTone($rank) }}
                            </span>
                        </div>

                        <div class="mt-2 space-y-1.5">
                            @foreach ($rank['requirements'] as $requirement)
                                @php
                                    $tone = $toneOf($requirement, (bool) $rank['locked']);
                                    [$label, $class] = $statuses[$tone];
                                    $href = ($requirement['type'] === 'merit' && $requirement['requiredBadgeId'])
                                        ? route('advancement.badge', $requirement['requiredBadgeId'])
                                        : route('advancement.requirement', $requirement['id']);
                                @endphp

                                @if ($rank['locked'])
                                    <div class="flex cursor-not-allowed items-center gap-3 rounded-xl border-2 border-[#eef5ec] bg-white/60 px-3 py-2 opacity-70">
                                        @include('components.partials.timeline-row', ['requirement' => $requirement, 'label' => $label, 'class' => $class])
                                    </div>
                                @else
                                    <a href="{{ $href }}" class="flex items-center gap-3 rounded-xl border-2 border-[#eef5ec] bg-white/70 px-3 py-2 hover:border-[#2d6a4f]">
                                        @include('components.partials.timeline-row', ['requirement' => $requirement, 'label' => $label, 'class' => $class])
                                    </a>
                                @endif
                            @endforeach
                        </div>
                    </li>
                @endforeach
            </ol>
        @endif

        @if ($lockedNext)
            <p class="mt-5 rounded-2xl bg-white/70 p-3 text-sm font-bold text-[#52796f]">
                🔒 Next level: <strong>{{ $lockedNext['icon'] }} {{ $lockedNext['name'] }}</strong> — opens when you finish {{ $lockedNext['lockedByName'] }}.
            </p>
        @endif
    </section>
@endif

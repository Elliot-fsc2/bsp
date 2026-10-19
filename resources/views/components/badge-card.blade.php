@props(['badge' => []])

@php
    $b = $badge;
    $locked = $b['locked'] ?? false;
    $earned = $b['earned'] ?? false;
    $applicationStatus = $b['applicationStatus'] ?? null;
    $ring = $locked
        ? "Locked · earn the {$b['lockedByName']}"
        : ($earned
            ? 'Earned'
            : (in_array($applicationStatus, ['pending', 'level1_approved'], true)
                ? 'In review'
                : ($b['satisfiedCount'] ?? 0).'/'.($b['totalCount'] ?? 0).' done'));
@endphp

<a href="{{ route('advancement.badge', $b['id']) }}" class="block overflow-hidden rounded-3xl border border-[#dbe7d8] bg-white transition hover:border-[#2d6a4f]">
    <div class="relative flex h-36 items-center justify-center" style="background: linear-gradient(135deg, {{ $b['programColor'] }}22, {{ $b['programColor'] }}55)">
        @if ($b['imageUrl'])
            <img src="{{ $b['imageUrl'] }}" alt="" class="h-28 w-28 {{ $locked ? 'opacity-40 grayscale' : '' }}">
        @else
            <span class="grid h-24 w-24 place-items-center rounded-full text-4xl {{ $locked ? 'opacity-40 grayscale' : '' }}" style="background: {{ $b['programColor'] }}">
                {{ ($b['kind'] ?? '') === 'merit' ? '🎖️' : '⚜️' }}
            </span>
        @endif

        @if (! is_null($b['rankStep'] ?? null))
            <span class="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold">Rank {{ $b['rankStep'] }}@if ($b['rankCount']) of {{ $b['rankCount'] }}@endif</span>
        @elseif (! empty($b['isMembership']))
            <span class="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold">Membership</span>
        @endif

        @if ($locked)
            <span class="absolute right-3 top-3 rounded-full bg-[#e5e7eb] px-3 py-1 text-xs font-extrabold">🔒 Locked</span>
        @elseif ($earned)
            <span class="absolute right-3 top-3 rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold">Earned</span>
        @endif
    </div>

    <div class="p-4">
        <p class="text-xs font-extrabold uppercase tracking-wide text-[#52796f]">
            {{ $b['programIcon'] }} {{ $b['programName'] }} · {{ ($b['kind'] ?? '') === 'merit' ? 'Merit badge' : 'Rank' }}
        </p>
        <h3 class="mt-1 text-lg font-semibold leading-tight">{{ $b['name'] }}</h3>
        <p class="mt-1 line-clamp-2 text-sm text-[#52796f]">{{ to_plain_text($b['description']) ?: '—' }}</p>

        @if (! empty($b['requiredBy']))
            <p class="mt-2 text-[11px] font-bold text-[#52796f]">
                Required by: {{ collect($b['requiredBy'])->pluck('name')->implode(', ') }}
            </p>
        @endif

        <div class="mt-3 flex justify-between text-xs font-extrabold">
            <span>{{ $ring }}</span>
            @unless ($locked)
                <span>{{ $b['percent'] }}%</span>
            @endunless
        </div>
        <div class="mt-1 h-2 overflow-hidden rounded-full bg-[#eef5ec]">
            <div class="h-full bg-[#2d6a4f]" style="width: {{ $locked ? 0 : $b['percent'] }}%"></div>
        </div>
    </div>
</a>

@php
    $b = $badge;
    $locked = $b['locked'] ?? false;
    $earned = $b['earned'] ?? false;
    $canApply = $b['canApply'] ?? false;
@endphp

<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold {{ $earned ? 'bg-[#d8f3dc]' : 'bg-[#f3f7f1]' }}">{{ $index + 1 }}</span>

@if ($b['imageUrl'])
    <img src="{{ $b['imageUrl'] }}" alt="" class="h-10 w-10 {{ $locked ? 'opacity-40 grayscale' : '' }}">
@else
    <span class="text-2xl {{ $locked ? 'opacity-40 grayscale' : '' }}">⚜️</span>
@endif

<span class="min-w-0 flex-1">
    <span class="block font-extrabold">
        {{ $b['name'] }}
        @if (! empty($b['isMembership']))
            <span class="ml-2 rounded-full bg-[#d8f3dc] px-2 py-0.5 text-[10px] font-extrabold">Membership</span>
        @endif
    </span>
    <span class="block text-xs text-[#52796f]">
        @if ($locked)
            🔒 Locked — earn the {{ $b['lockedByName'] }} first
        @elseif ($earned)
            Earned
        @else
            {{ $b['satisfiedCount'] }}/{{ $b['totalCount'] }} requirements complete ({{ $b['percent'] }}%)
        @endif
    </span>
</span>

@if ($earned)
    <span class="rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold">Earned</span>
@elseif ($canApply)
    <span class="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-extrabold">Ready to submit</span>
@elseif ($locked)
    <span class="rounded-full bg-[#f3f7f1] px-3 py-1 text-xs font-extrabold opacity-70">Locked</span>
@else
    <span class="text-sm font-extrabold text-[#1d4e89]">Open →</span>
@endif

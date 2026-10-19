@props(['ranks' => [], 'disabled' => false])

<ol class="space-y-2">
    @foreach ($ranks as $index => $badge)
        @php
            $locked = $badge['locked'] ?? false;
        @endphp
        <li>
            @if ($disabled || $locked)
                <div class="flex cursor-not-allowed items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-3 opacity-60 grayscale">
                    @include('components.partials.rank-row', ['badge' => $badge, 'index' => $index])
                </div>
            @else
                <a href="{{ route('advancement.badge', $badge['id']) }}" class="flex items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-3 hover:border-[#2d6a4f]">
                    @include('components.partials.rank-row', ['badge' => $badge, 'index' => $index])
                </a>
            @endif
        </li>
    @endforeach
</ol>

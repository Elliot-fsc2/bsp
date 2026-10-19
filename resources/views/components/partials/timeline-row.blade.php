@php
    $r = $requirement;
    $parts = [$r['points'].' pts'];
    if ($r['requiresMedia']) {
        $parts[] = $r['mediaKind'] === 'video' ? 'video proof' : 'photo proof';
    }
    if ($r['quiz']) {
        $parts[] = 'quiz';
    }
    if ($r['type'] === 'merit' && $r['requiredBadgeName']) {
        $parts[] = 'merit badge: '.$r['requiredBadgeName'];
    }
@endphp

<span class="min-w-0 flex-1">
    <span class="block truncate font-bold">{{ $r['title'] }}</span>
    <span class="block text-[11px] text-[#52796f]">{{ implode(' · ', $parts) }}</span>
</span>
<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold {{ $class }}">{{ $label }}</span>
<span class="text-sm font-extrabold text-[#1d4e89]">›</span>

@props(['status' => null])

@php
    $labels = [
        'pending' => 'Waiting for Scout Leader',
        'level1_approved' => 'Waiting for Council Admin',
        'approved' => 'Approved',
        'rejected' => 'Needs revision',
    ];
    $tones = [
        'pending' => 'bg-[#fff3c4]',
        'level1_approved' => 'bg-[#dbeafe]',
        'approved' => 'bg-[#d8f3dc]',
        'rejected' => 'bg-[#ffe0e8]',
    ];
@endphp

<span class="inline-flex rounded-full px-3 py-1 text-xs font-extrabold {{ $tones[$status] ?? 'bg-white' }}">
    {{ $labels[$status] ?? 'Not started' }}
</span>

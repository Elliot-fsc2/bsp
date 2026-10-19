@props(['name' => '?', 'color' => '#2d6a4f', 'size' => 40])

<span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
    style="width: {{ (int) $size }}px; height: {{ (int) $size }}px; background: {{ $color }}; font-size: {{ (int) ($size * 0.36) }}px"
>{{ initials($name) }}</span>

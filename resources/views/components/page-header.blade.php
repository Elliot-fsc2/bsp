@props(['eyebrow' => null, 'title' => '', 'text' => null])

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
        @if ($eyebrow)
            <p class="mb-2 inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1b4332]">{{ $eyebrow }}</p>
        @endif
        <h1 class="text-3xl font-semibold md:text-4xl">{{ $title }}</h1>
        @if ($text)
            <p class="mt-2 max-w-2xl text-[15px] text-[#52796f]">{{ $text }}</p>
        @endif
    </div>
    @if (isset($action))
        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">{{ $action }}</div>
    @endif
</div>

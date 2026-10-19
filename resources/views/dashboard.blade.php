@extends('layouts.campus')

@section('title', 'Dashboard — BSP Advancement Portal')

@section('content')
    <x-page-header
        :eyebrow="($settings['mascotName'] ?? 'Handa').' saved you a seat'"
        :title="$greeting"
        :text="$user->isAdmin()
            ? 'The council office is open. Review approvals and watch the movement grow.'
            : ($user->isTeacher()
                ? 'Your approval queue and your Scouts\' progress are ready.'
                : 'Pick up your badge, complete the next requirement, or start something new.')"
    >
        <x-slot:action>
            <a href="{{ route('advancement.index') }}" class="rounded-full bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white">
                {{ $user->isStudent() ? 'Browse badges' : 'Advancement' }}
            </a>
        </x-slot:action>
    </x-page-header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @foreach ([
            ['🏅', '#ffd166', 'Badges earned', $awarded->count()],
            ['🧭', '#cbb6ff', 'In progress', $totals['inProgress']],
            ['📤', '#b8f2e6', 'Ready to submit', $readyToApplyCount],
            [$user->isStudent() ? '📣' : '✅', '#ffd0e3', $user->isStudent() ? 'Council news' : 'Needs approval', $user->isStudent() ? $announcements->count() : $pendingApprovals->count()],
        ] as [$icon, $tone, $label, $value])
            <div class="rounded-3xl border border-[#dbe7d8] bg-white p-5">
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl text-xl" style="background: {{ $tone }}">{{ $icon }}</div>
                <p class="text-sm font-bold text-[#52796f]">{{ $label }}</p>
                <p class="text-3xl font-semibold">{{ $value }}</p>
            </div>
        @endforeach
    </div>

    <div class="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section class="space-y-5">
            <div>
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 class="text-2xl font-semibold">Continue your advancement</h2>
                    <div class="flex flex-wrap items-center gap-3">
                        <a href="{{ route('advancement.mine') }}" class="text-sm font-extrabold text-[#1d4e89]">What's left to do →</a>
                        <a href="{{ route('advancement.index') }}" class="text-sm font-extrabold text-[#1d4e89]">All badges →</a>
                    </div>
                </div>
                @if (count($inProgress) === 0)
                    <p class="rounded-3xl border border-[#dbe7d8] bg-white p-6 text-[#52796f]">
                        No badge started yet.
                        <a href="{{ route('advancement.index') }}" class="font-extrabold text-[#1d4e89]">Choose a program</a>
                        and begin with the Membership Badge.
                    </p>
                @else
                    <div class="grid gap-4 md:grid-cols-2">
                        @foreach ($inProgress as $badge)
                            <x-badge-card :badge="$badge" />
                        @endforeach
                    </div>
                @endif
            </div>

            @if ($awarded->count() > 0)
                <div>
                    <h2 class="mb-3 text-2xl font-semibold">Earned badges</h2>
                    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        @foreach ($awarded as $row)
                            <a href="{{ route('advancement.badge', $row->badge_id) }}" class="flex items-center gap-3 rounded-3xl border border-[#dbe7d8] bg-white p-3">
                                @if ($row->badge?->image_url)
                                    <img src="{{ $row->badge->image_url }}" alt="" class="h-12 w-12">
                                @else
                                    <span class="text-2xl">🎖️</span>
                                @endif
                                <span class="min-w-0">
                                    <span class="block truncate text-sm font-extrabold">{{ $row->badge?->name }}</span>
                                    <span class="block text-xs text-[#52796f]">{{ $row->badge?->program?->name }}</span>
                                </span>
                            </a>
                        @endforeach
                    </div>
                </div>
            @endif
        </section>

        <aside class="space-y-3">
            <div class="rounded-3xl border border-[#dbe7d8] bg-white p-4">
                <div class="flex items-center gap-2 font-extrabold">🗓️ Coming up <span class="ml-auto rounded-full bg-[#f3f7f1] px-2 py-0.5 text-xs">{{ $events->count() }}</span></div>
                <div class="mt-3 space-y-2">
                    @forelse ($events as $event)
                        <div class="rounded-2xl bg-white/80 p-3">
                            <p class="text-sm font-extrabold">{{ $event->title }}</p>
                            <p class="text-xs text-[#52796f]">{{ format_date($event->start_at) }}</p>
                        </div>
                    @empty
                        <p class="text-sm text-[#52796f]">Nothing on the calendar yet.</p>
                    @endforelse
                </div>
            </div>

            <div class="rounded-3xl border border-[#dbe7d8] bg-white p-4">
                <div class="flex items-center gap-2 font-extrabold">📣 Latest news @if ($announcements->count() > 1) <span class="ml-auto rounded-full bg-[#f3f7f1] px-2 py-0.5 text-xs">{{ $announcements->count() }}</span> @endif</div>
                @if ($announcements->isEmpty())
                    <p class="mt-3 text-sm text-[#52796f]">No news yet.</p>
                @else
                    @php
                        $latest = $announcements->first();
                    @endphp
                    <div class="mt-3 rounded-2xl bg-white/80 p-3">
                        <p class="text-sm font-extrabold">{{ $latest->title }}</p>
                        <p class="line-clamp-3 text-xs text-[#52796f]">{{ to_plain_text($latest->body) }}</p>
                        <p class="mt-1 text-[11px] font-bold text-[#52796f]">{{ $latest->author?->name }} · {{ relative_time($latest->created_at) }}</p>
                    </div>
                @endif
            </div>

            @unless ($user->isStudent())
                <div class="rounded-3xl border border-[#dbe7d8] bg-white p-4">
                    <div class="flex items-center gap-2 font-extrabold">✅ Approval tray <span class="ml-auto rounded-full bg-[#f3f7f1] px-2 py-0.5 text-xs">{{ $pendingApprovals->count() }}</span></div>
                    <div class="mt-3 space-y-2">
                        @forelse ($pendingApprovals as $item)
                            <a href="{{ route('approvals.show', $item->id) }}" class="block rounded-2xl bg-white/80 p-3">
                                <p class="text-sm font-extrabold">{{ $item->requirement?->title ?? ($item->badge?->name.' — badge application') }}</p>
                                <p class="text-xs text-[#52796f]">{{ $item->user->name }}</p>
                            </a>
                        @empty
                            <p class="text-sm text-[#52796f]">Inbox zero, Scout Leader glow.</p>
                        @endforelse
                        <a href="{{ route('approvals.index') }}" class="block text-sm font-extrabold text-[#1d4e89]">Open approvals →</a>
                    </div>
                </div>
            @endunless

            <div class="rounded-3xl border border-[#dbe7d8] bg-white p-4">
                <div class="flex items-center gap-2 font-extrabold">🔔 Notifications <span class="ml-auto rounded-full bg-[#f3f7f1] px-2 py-0.5 text-xs">{{ $notifications->count() }}</span></div>
                <div class="mt-3 space-y-2">
                    @forelse ($notifications as $notification)
                        <div class="rounded-2xl bg-white/80 p-3">
                            <p class="text-sm font-extrabold">{{ $notification->title }}</p>
                            <p class="text-xs text-[#52796f]">{{ $notification->body }}</p>
                            <p class="mt-1 text-[11px] font-bold text-[#52796f]">{{ relative_time($notification->created_at) }}</p>
                        </div>
                    @empty
                        <p class="text-sm text-[#52796f]">You're all caught up.</p>
                    @endforelse
                </div>
                @if ($notifications->where('read', false)->count() > 0)
                    <form method="POST" action="{{ route('notifications.read') }}" class="mt-3">
                        @csrf
                        <button class="text-sm font-extrabold text-[#1d4e89]">Mark all as read</button>
                    </form>
                @endif
            </div>
        </aside>
    </div>
@endsection

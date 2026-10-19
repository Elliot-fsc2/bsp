<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', ($settings['siteName'] ?? 'BSP Advancement Portal'))</title>
    <link rel="icon" href="{{ $settings['faviconUrl'] ?? '/images/logo.svg' }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="min-h-screen bg-[#f3f7f1] text-[#1c3314] antialiased">
    @php
        $user = auth()->user();
    @endphp
    <header class="border-b border-[#dbe7d8] bg-white/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
            <a href="{{ route('dashboard') }}" class="flex items-center gap-2 font-semibold">
                <span class="grid h-9 w-9 place-items-center rounded-xl bg-[#d8f3dc]">⚜️</span>
                <span class="hidden sm:inline">{{ $settings['siteName'] ?? 'BSP' }}</span>
            </a>

            <nav class="flex flex-wrap items-center gap-1 text-sm font-bold">
                @php
                    $links = [
                        ['Dashboard', route('dashboard')],
                        ['Advancement', route('advancement.index')],
                        ['Merit badges', route('advancement.merit-badges')],
                        ["What's left", route('advancement.mine')],
                    ];
                    if ($user->isApprover()) {
                        $links[] = ['Approvals', route('approvals.index')];
                    }
                    $current = url()->current();
                @endphp
                @foreach ($links as [$label, $url])
                    <a href="{{ $url }}" class="rounded-full px-3 py-1.5 {{ $current === $url ? 'bg-[#d8f3dc]' : 'hover:bg-[#eef5ec]' }}">{{ $label }}</a>
                @endforeach
            </nav>

            <div class="ml-auto flex items-center gap-3">
                <div class="hidden text-right sm:block">
                    <p class="text-xs font-extrabold leading-tight">{{ $user->name }}</p>
                    <p class="text-[11px] font-bold text-[#52796f]">{{ role_label($user->role) }}</p>
                </div>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button class="rounded-full border-2 border-[#2d6a4f] px-3 py-1.5 text-xs font-bold text-[#2d6a4f]">Log out</button>
                </form>
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-6xl px-5 py-8">
        @if (session('status'))
            <p class="mb-4 rounded-2xl bg-[#d8f3dc] px-3 py-2 text-sm font-bold">{{ session('status') }}</p>
        @endif

        @yield('content')
    </main>

    @livewireScripts
</body>
</html>

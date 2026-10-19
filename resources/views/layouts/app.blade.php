<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', $settings['siteName'] ?? 'BSP Advancement Portal')</title>
    <link rel="icon" href="{{ $settings['faviconUrl'] ?? '/images/logo.svg' }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-[#f3f7f1] text-[#1c3314] antialiased">
    @yield('content')
</body>
</html>

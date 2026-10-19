<?php

use App\Support\RichText;
use Illuminate\Support\Carbon;
use Illuminate\Support\CarbonInterface;

if (! function_exists('initials')) {
    function initials(?string $name): string
    {
        $parts = array_values(array_filter(preg_split('/\s+/', trim((string) $name)) ?: []));
        $parts = array_slice($parts, 0, 2);

        return implode('', array_map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)), $parts));
    }
}

if (! function_exists('role_label')) {
    function role_label(?string $role): string
    {
        return match ($role) {
            'admin' => 'Council Admin',
            'teacher' => 'Scout Leader',
            default => 'Scout',
        };
    }
}

if (! function_exists('to_carbon')) {
    function to_carbon(mixed $value): ?Carbon
    {
        if (! $value) {
            return null;
        }
        if ($value instanceof CarbonInterface) {
            return Carbon::instance($value);
        }

        try {
            return Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }
    }
}

if (! function_exists('format_date')) {
    function format_date(mixed $value): string
    {
        return to_carbon($value)?->format('M j, Y') ?? 'No date';
    }
}

if (! function_exists('format_datetime')) {
    function format_datetime(mixed $value): string
    {
        return to_carbon($value)?->format('M j, g:i A') ?? '';
    }
}

if (! function_exists('relative_time')) {
    function relative_time(mixed $value): string
    {
        $date = to_carbon($value);
        if (! $date) {
            return '';
        }

        $diff = now()->getTimestamp() - $date->getTimestamp();

        if ($diff < 60) {
            return 'just now';
        }
        $minutes = (int) round($diff / 60);
        if ($minutes < 60) {
            return $minutes.'m ago';
        }
        $hours = (int) round($minutes / 60);
        if ($hours < 24) {
            return $hours.'h ago';
        }
        $days = (int) round($hours / 24);
        if ($days < 14) {
            return $days.'d ago';
        }

        return format_date($date);
    }
}

if (! function_exists('to_plain_text')) {
    function to_plain_text(?string $value): string
    {
        return RichText::toPlainText($value);
    }
}

if (! function_exists('clamp_percent')) {
    function clamp_percent(mixed $value): int
    {
        return (int) max(0, min(100, (int) round((float) $value)));
    }
}

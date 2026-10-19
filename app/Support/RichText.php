<?php

namespace App\Support;

/**
 * Light, dependency-free sanitizer for the HTML TinyMCE produces.
 * Ported from the original src/lib/richtext.ts.
 */
class RichText
{
    public static function isRichHtml(?string $value): bool
    {
        return is_string($value) && preg_match('/<\/?[a-z][\s\S]*>/i', $value) === 1;
    }

    public static function sanitizeHtml(string $html): string
    {
        $html = preg_replace('/<\s*(script|style|iframe|object|embed|form|input|button)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/i', '', $html) ?? $html;
        $html = preg_replace('/<\s*\/?\s*(script|style|iframe|object|embed|link|form|input|button)\b[^>]*>/i', '', $html) ?? $html;
        $html = preg_replace('/\son[a-z]+\s*=\s*"[^"]*"/i', '', $html) ?? $html;
        $html = preg_replace("/\son[a-z]+\s*=\s*'[^']*'/i", '', $html) ?? $html;
        $html = preg_replace('/\son[a-z]+\s*=\s*[^\s>]+/i', '', $html) ?? $html;
        $html = preg_replace('/(href|src)\s*=\s*"?\s*javascript:[^">]*"?/i', '$1="#"', $html) ?? $html;
        $html = preg_replace('/(<\s*a\b[^>]*?)target\s*=\s*["\']_blank["\']/i', '$1target="_blank" rel="noopener noreferrer"', $html) ?? $html;

        return $html;
    }

    /** Turn rich HTML into a single-line preview string. */
    public static function toPlainText(?string $value): string
    {
        if (! $value) {
            return '';
        }

        $text = self::sanitizeHtml($value);
        $text = preg_replace('/<\s*(br|\/p|\/li|\/div|\/h[1-6])\s*\/?>/i', ' ', $text) ?? $text;
        $text = preg_replace('/<[^>]+>/', '', $text) ?? $text;
        $text = str_replace(['&nbsp;', '&amp;', '&lt;', '&gt;'], [' ', '&', '<', '>'], $text);
        $text = preg_replace('/\s+/', ' ', $text) ?? $text;

        return trim($text);
    }

    /**
     * Normalize TinyMCE output: keeps markup, drops "empty" editors that only
     * hold <p><br></p>.
     */
    public static function normalize(mixed $value): string
    {
        $raw = is_string($value) ? trim($value) : '';

        if ($raw === '') {
            return '';
        }

        return self::toPlainText($raw) !== '' ? $raw : '';
    }

    /**
     * Plain seed text becomes safe paragraphs; TinyMCE HTML is sanitized and
     * passed through.
     */
    public static function toSafeHtml(?string $value): string
    {
        if (! $value) {
            return '';
        }

        if (self::isRichHtml($value)) {
            return self::sanitizeHtml($value);
        }

        $blocks = preg_split('/\n{2,}/', $value) ?: [];

        return implode('', array_map(function (string $block): string {
            $escaped = str_replace(['&', '<', '>'], ['&amp;', '&lt;', '&gt;'], $block);
            $escaped = str_replace("\n", '<br />', $escaped);

            return '<p>'.$escaped.'</p>';
        }, $blocks));
    }
}

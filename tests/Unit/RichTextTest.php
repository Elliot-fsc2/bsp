<?php

namespace Tests\Unit;

use App\Support\RichText;
use PHPUnit\Framework\TestCase;

class RichTextTest extends TestCase
{
    public function test_is_rich_html_detects_markup(): void
    {
        $this->assertTrue(RichText::isRichHtml('<p>Hello</p>'));
        $this->assertFalse(RichText::isRichHtml('Just plain text'));
        $this->assertFalse(RichText::isRichHtml(null));
    }

    public function test_sanitize_removes_scripts_and_event_handlers(): void
    {
        $clean = RichText::sanitizeHtml('<p onclick="evil()">Hi</p><script>alert(1)</script>');

        $this->assertStringNotContainsString('script', $clean);
        $this->assertStringNotContainsString('onclick', $clean);
        $this->assertStringContainsString('Hi', $clean);
    }

    public function test_normalize_drops_empty_editors(): void
    {
        $this->assertSame('', RichText::normalize('<p><br></p>'));
        $this->assertSame('', RichText::normalize('   '));
        $this->assertSame('', RichText::normalize(null));
        $this->assertSame('<p>Hello</p>', RichText::normalize('<p>Hello</p>'));
    }

    public function test_to_plain_text_flattens_markup(): void
    {
        $this->assertSame('one two', RichText::toPlainText('<p>one</p><p>two</p>'));
    }

    public function test_to_safe_html_wraps_plain_text_and_escapes(): void
    {
        $this->assertSame('<p>a &amp; b</p>', RichText::toSafeHtml('a & b'));
        $this->assertSame('<p>first</p><p>second</p>', RichText::toSafeHtml("first\n\nsecond"));
        $this->assertSame('<p>line1<br />line2</p>', RichText::toSafeHtml("line1\nline2"));
    }
}

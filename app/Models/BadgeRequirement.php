<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BadgeRequirement extends Model
{
    public const TYPE_TASK = 'task';

    public const TYPE_RECITE = 'recite';

    public const TYPE_QUIZ = 'quiz';

    public const TYPE_MERIT = 'merit';

    protected $table = 'badge_requirements';

    protected $guarded = [];

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'requires_text' => 'boolean',
            'requires_media' => 'boolean',
            'requires_link' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }

    /** The merit badge that satisfies a requirement of type "merit". */
    public function requiredBadge(): BelongsTo
    {
        return $this->belongsTo(Badge::class, 'required_badge_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'requirement_id');
    }

    /** @return array<int, array{q: string, options: array<int, string>, answer: int}> */
    public function quiz(): array
    {
        if (! $this->quiz_json) {
            return [];
        }

        $parsed = json_decode($this->quiz_json, true);

        return is_array($parsed) ? $parsed : [];
    }
}

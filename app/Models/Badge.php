<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Badge extends Model
{
    public const KIND_RANK = 'rank';

    public const KIND_MERIT = 'merit';

    protected $table = 'badges';

    protected $guarded = [];

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'is_membership' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BadgeCategory::class, 'category_id');
    }

    public function requirements(): HasMany
    {
        return $this->hasMany(BadgeRequirement::class)->orderBy('position')->orderBy('id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function awardedBadges(): HasMany
    {
        return $this->hasMany(AwardedBadge::class);
    }

    public function scopeRanks(Builder $query): Builder
    {
        return $query->where('kind', self::KIND_RANK);
    }

    public function scopeMerits(Builder $query): Builder
    {
        return $query->where('kind', self::KIND_MERIT);
    }
}

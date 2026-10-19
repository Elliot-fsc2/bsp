<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BadgeCategory extends Model
{
    protected $table = 'badge_categories';

    protected $guarded = [];

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function badges(): HasMany
    {
        return $this->hasMany(Badge::class, 'category_id');
    }
}

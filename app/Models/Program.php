<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    protected $table = 'programs';

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
        return $this->hasMany(Badge::class);
    }

    public function ranks(): HasMany
    {
        return $this->hasMany(Badge::class)->where('kind', 'rank');
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function forumTopics(): HasMany
    {
        return $this->hasMany(ForumTopic::class);
    }

    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
    }
}

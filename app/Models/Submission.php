<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    public const KIND_REQUIREMENT = 'requirement';

    public const KIND_BADGE = 'badge';

    public const STATUS_PENDING = 'pending';

    public const STATUS_LEVEL1_APPROVED = 'level1_approved';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $table = 'submissions';

    protected $guarded = [];

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(BadgeRequirement::class, 'requirement_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class)->orderBy('level')->orderBy('created_at');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_LEVEL1_APPROVED], true);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('awarded_badges', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('badge_id');
            $table->timestamp('awarded_at')->useCurrent();

            $table->unique(['user_id', 'badge_id'], 'awarded_user_badge');

            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('badge_id')->references('id')->on('badges');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('awarded_badges');
    }
};

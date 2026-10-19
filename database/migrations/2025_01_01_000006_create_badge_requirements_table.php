<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badge_requirements', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('badge_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('instructions')->nullable();
            $table->string('type', 16)->default('task');
            $table->integer('position')->default(0);
            $table->boolean('requires_text')->default(true);
            $table->boolean('requires_media')->default(false);
            $table->string('media_kind', 16)->default('video');
            $table->boolean('requires_link')->default(false);
            $table->text('quiz_json')->nullable();
            $table->unsignedInteger('required_badge_id')->nullable();
            $table->integer('points')->default(10);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('badge_id')->references('id')->on('badges');
            $table->foreign('required_badge_id')->references('id')->on('badges');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badge_requirements');
    }
};

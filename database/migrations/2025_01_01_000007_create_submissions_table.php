<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('kind', 16)->default('requirement');
            $table->unsignedInteger('badge_id');
            $table->unsignedInteger('requirement_id')->nullable();
            $table->text('text_content')->nullable();
            $table->text('media_url')->nullable();
            $table->string('media_type', 16)->nullable();
            $table->text('external_url')->nullable();
            $table->string('storage_provider', 16)->default('server');
            $table->string('drive_file_id', 191)->nullable();
            $table->string('drive_url', 512)->nullable();
            $table->string('drive_shared_with', 191)->nullable();
            $table->text('quiz_json')->nullable();
            $table->integer('quiz_score')->nullable();
            $table->string('status', 24)->default('pending');
            $table->integer('levels_approved')->default(0);
            $table->integer('levels_required')->default(2);
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('decided_at')->nullable();

            $table->unique(['user_id', 'requirement_id'], 'submissions_user_requirement');

            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('badge_id')->references('id')->on('badges');
            $table->foreign('requirement_id')->references('id')->on('badge_requirements');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};

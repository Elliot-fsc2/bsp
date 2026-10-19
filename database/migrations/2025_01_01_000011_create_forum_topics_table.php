<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_topics', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('program_id')->nullable();
            $table->unsignedInteger('author_id');
            $table->string('title');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('program_id')->references('id')->on('programs');
            $table->foreign('author_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_topics');
    }
};

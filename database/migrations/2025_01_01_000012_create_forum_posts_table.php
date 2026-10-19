<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_posts', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('topic_id');
            $table->unsignedInteger('author_id');
            $table->text('body');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('topic_id')->references('id')->on('forum_topics');
            $table->foreign('author_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_posts');
    }
};

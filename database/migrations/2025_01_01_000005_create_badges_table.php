<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('program_id');
            $table->unsignedInteger('category_id')->nullable();
            $table->string('kind', 16)->default('rank');
            $table->string('name', 180);
            $table->string('slug', 200)->unique();
            $table->text('description')->nullable();
            $table->text('image_url')->nullable();
            $table->boolean('is_membership')->default(false);
            $table->integer('position')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('program_id')->references('id')->on('programs');
            $table->foreign('category_id')->references('id')->on('badge_categories');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};

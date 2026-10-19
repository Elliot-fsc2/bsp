<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badge_categories', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 160);
            $table->string('slug', 160)->unique();
            $table->text('description')->nullable();
            $table->string('color', 32)->default('#2d6a4f');
            $table->string('icon', 32)->default('*');
            $table->integer('position')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badge_categories');
    }
};

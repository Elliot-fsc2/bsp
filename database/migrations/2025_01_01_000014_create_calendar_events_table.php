<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('program_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('start_at');
            $table->string('type', 32)->default('event');

            $table->foreign('program_id')->references('id')->on('programs');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};

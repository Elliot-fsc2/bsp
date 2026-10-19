<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('submission_id');
            $table->unsignedInteger('approver_id');
            $table->integer('level');
            $table->string('decision', 16);
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('submission_id')->references('id')->on('submissions');
            $table->foreign('approver_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};

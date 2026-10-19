<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('role', 32)->default('student');
            $table->string('avatar_color', 32)->default('#2d6a4f');
            $table->text('bio')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->string('google_email', 191)->nullable();
            $table->string('google_refresh_token', 512)->nullable();
            $table->string('google_folder_id', 191)->nullable();
            $table->timestamp('google_connected_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

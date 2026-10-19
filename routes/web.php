<?php

use App\Http\Controllers\AdvancementController;
use App\Http\Controllers\ApprovalsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('home');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/advancement', [AdvancementController::class, 'index'])->name('advancement.index');
    Route::get('/advancement/badge/{badge}', [AdvancementController::class, 'badge'])->name('advancement.badge');
    Route::post('/advancement/badge/{badge}/apply', [AdvancementController::class, 'applyBadge'])->name('advancement.badge.apply');
    Route::get('/advancement/requirement/{requirement}', [AdvancementController::class, 'requirement'])->name('advancement.requirement');
    Route::get('/merit-badges', [AdvancementController::class, 'meritBadges'])->name('advancement.merit-badges');
    Route::get('/my-advancement', [AdvancementController::class, 'myAdvancement'])->name('advancement.mine');
    // Declared last so /badge/... and /requirement/... above win.
    Route::get('/advancement/{programSlug}', [AdvancementController::class, 'program'])->name('advancement.program');

    Route::post('/notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    Route::middleware('role:teacher,admin')->group(function () {
        Route::get('/approvals', [ApprovalsController::class, 'index'])->name('approvals.index');
        Route::get('/approvals/{submission}', [ApprovalsController::class, 'show'])->name('approvals.show');
    });
});

Route::get('/health', fn () => response()->json(['ok' => true]));

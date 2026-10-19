<?php

namespace App\Http\Controllers;

use App\Services\SubmissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function markRead(Request $request, SubmissionService $submissions): RedirectResponse
    {
        $submissions->markNotificationsRead($request->user());

        return back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use App\Models\Program;
use App\Support\SiteSettings;
use Illuminate\Contracts\View\View;

class LandingController extends Controller
{
    public function index(): View
    {
        return view('landing', [
            'settings' => SiteSettings::all(),
            'programs' => Program::query()->orderBy('position')->orderBy('id')->get(),
            'badgeCount' => Badge::query()->count(),
        ]);
    }
}

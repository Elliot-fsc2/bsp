<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Portal session cookie
    |--------------------------------------------------------------------------
    |
    | The portal keeps its own `sessions` table (token + expires_at) exactly as
    | the original Next.js app did, and carries the token in this cookie. It is
    | deliberately independent of Laravel's own session driver.
    |
    */

    'session_cookie' => env('BSP_SESSION_COOKIE', 'bsp_session'),

    'session_days' => (int) env('BSP_SESSION_DAYS', 14),

];

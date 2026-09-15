<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS, BSNL and more.
    |
    */

    'bsnl' => [
        'base_url'        => env('BSNL_BASE_URL', 'https://bulksms.bsnl.in:5010'),
        'service_id'      => env('BSNL_SMS_PEID'),
        'username'        => env('BSNL_SMS_USER_ID'),
        'password'        => env('BSNL_SMS_PASSWORD'),
        'entity_id'       => env('BSNL_SMS_PEID'),
        'sender_id'       => env('BSNL_SMS_SENDER_ID', 'FILLOS'),
        'otp_template_id' => env('BSNL_SMS_OTP_TEMPLATE_ID', '1407174738249686570'),
        'api_key'         => env('BSNL_SMS_API_KEY'),
    ],

    'youtube_music' => [
        'url' => env('YOUTUBE_MUSIC_SERVICE_URL', 'http://127.0.0.1:8001'),
        'timeout' => (int) env('YOUTUBE_MUSIC_SERVICE_TIMEOUT', 4),
        'cache_ttl' => (int) env('YOUTUBE_MUSIC_CACHE_TTL', 3600),
        'enabled' => env('YOUTUBE_MUSIC_ENABLED', true),
    ],

];

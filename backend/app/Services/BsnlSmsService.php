<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BsnlSmsService
{
    protected string $baseUrl;
    protected ?string $serviceId;
    protected ?string $username;
    protected ?string $password;
    protected ?string $entityId;
    protected ?string $senderId;
    protected ?string $otpTemplateId;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.bsnl.base_url', 'https://bulksms.bsnl.in:5010'), '/');
        $this->serviceId = config('services.bsnl.service_id');
        $this->username = config('services.bsnl.username');
        $this->password = config('services.bsnl.password');
        $this->entityId = config('services.bsnl.entity_id');
        $this->senderId = config('services.bsnl.sender_id', 'FILLOS');
        $this->otpTemplateId = config('services.bsnl.otp_template_id', '1407174738249686570');
        $this->apiKey = config('services.bsnl.api_key');
    }

    /**
     * Clean phone number to 10 digits
     */
    public static function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '91')) {
            $cleaned = substr($cleaned, 2);
        } elseif (strlen($cleaned) === 11 && str_starts_with($cleaned, '0')) {
            $cleaned = substr($cleaned, 1);
        }
        return $cleaned;
    }

    /**
     * Get or Generate JWT Token
     */
    protected function getToken(bool $forceRefresh = false): ?string
    {
        if ($this->apiKey && !$forceRefresh) {
            return $this->apiKey;
        }

        if ($forceRefresh) {
            Cache::forget('bsnl_api_token');
        }

        return Cache::remember('bsnl_api_token', 3600 * 8, function () {
            try {
                $response = Http::withoutVerifying()
                    ->timeout(10)
                    ->post("{$this->baseUrl}/api/Create_New_API_Token", [
                    'Service_Id' => $this->serviceId,
                    'Username'   => $this->username,
                    'Password'   => $this->password,
                    'Token_Id'   => '1',
                    'IP_Addresses' => null
                ]);

                if ($response->successful()) {
                    $token = trim($response->body(), '"');
                    Log::info('BSNL: Generated fresh API token');
                    return $token;
                }

                Log::error('BSNL API Token Generation Failed', ['response' => $response->body()]);
            } catch (\Throwable $e) {
                Log::error('BSNL API Token Generation Exception: ' . $e->getMessage());
            }

            return null;
        });
    }

    /**
     * Send OTP SMS using DLT template:
     * "Your OTP for login to {#app_name#} App is {#otp#}. Do not share it with anyone. - Powered by Fillosoft"
     */
    public function sendOtp(string $target, string $otp): bool
    {
        $cleanPhone = self::formatPhoneNumber($target);

        return $this->sendSms(
            $cleanPhone,
            $this->otpTemplateId,
            [
                'app_name' => config('app.name', 'Zubeefy'),
                'otp'      => $otp,
            ],
            $this->senderId
        );
    }

    /**
     * Send SMS via BSNL Gateway
     */
    public function sendSms(string $target, string $templateId, array $variables, string $header, string $messageType = 'SI'): bool
    {
        $token = $this->getToken();
        if (!$token) {
            Log::error('BSNL: No token available, cannot send SMS.');
            return false;
        }

        $formattedVariables = [];
        foreach ($variables as $key => $value) {
            $formattedVariables[] = ['Key' => $key, 'Value' => (string)$value];
        }

        $payload = [
            'Header'               => $header,
            'Target'               => $target,
            'Is_Unicode'           => '0',
            'Is_Flash'             => '0',
            'Message_Type'         => $messageType,
            'Entity_Id'            => $this->entityId,
            'Content_Template_Id'  => $templateId,
            'Template_Keys_and_Values' => $formattedVariables,
            'Consent_Template_Id'  => null
        ];

        try {
            $response = Http::withoutVerifying()
                ->timeout(12)
                ->withToken($token)
                ->post("{$this->baseUrl}/api/Send_SMS", $payload);

            Log::info('BSNL SMS Response', [
                'target' => $target,
                'status' => $response->status(),
                'body'   => $response->body()
            ]);

            if ($response->successful() && !empty($response->body())) {
                return true;
            }

            // Retry once if token might be expired or response is 401 / empty
            if (empty($response->body()) || $response->status() === 401) {
                Log::warning('BSNL: API key might be expired, refreshing token...');
                $freshToken = $this->getToken(true);
                if (!$freshToken) {
                    return false;
                }

                $retry = Http::withoutVerifying()
                    ->timeout(12)
                    ->withToken($freshToken)
                    ->post("{$this->baseUrl}/api/Send_SMS", $payload);

                Log::info('BSNL SMS Retry Response', [
                    'target' => $target,
                    'status' => $retry->status(),
                    'body'   => $retry->body()
                ]);

                return $retry->successful();
            }
        } catch (\Throwable $e) {
            Log::error('BSNL SMS Exception: ' . $e->getMessage(), ['target' => $target]);
        }

        return false;
    }
}

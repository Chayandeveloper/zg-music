<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PhoneOtp;
use App\Services\BsnlSmsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Send OTP via BSNL SMS Gateway
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'type'  => ['sometimes', 'string', 'in:login,register'],
        ]);

        $phone = BsnlSmsService::formatPhoneNumber($validated['phone']);

        if (strlen($phone) !== 10 || !ctype_digit($phone)) {
            return response()->json([
                'message' => 'Please enter a valid 10-digit Indian mobile number.',
            ], 422);
        }

        $type = $validated['type'] ?? null;
        $existingUser = User::where('phone', $phone)->first();

        if ($type === 'login' && !$existingUser) {
            return response()->json([
                'message' => 'No account found for this mobile number. Please register first.',
            ], 404);
        }

        if ($type === 'register' && $existingUser) {
            return response()->json([
                'message' => 'This mobile number is already registered. Please sign in instead.',
            ], 422);
        }

        // Rate limit: 60-second cooldown
        $recentOtp = PhoneOtp::where('phone', $phone)
            ->where('created_at', '>=', now()->subSeconds(60))
            ->latest()
            ->first();

        if ($recentOtp) {
            $secondsLeft = 60 - now()->diffInSeconds($recentOtp->created_at);
            return response()->json([
                'message' => "Please wait {$secondsLeft}s before requesting a new OTP.",
            ], 429);
        }

        // Generate 6-digit OTP
        $isDemo = in_array($phone, ['9876543210', '9876543211', '9999999999']);
        $otp = $isDemo ? '123456' : (string) random_int(100000, 999999);

        // Store OTP in database
        PhoneOtp::create([
            'phone'      => $phone,
            'otp'        => $otp,
            'expires_at' => now()->addMinutes(10),
            'ip_address' => $request->ip(),
        ]);

        // Dispatch via BSNL SMS Gateway
        $sent = true;
        if (!$isDemo) {
            /** @var BsnlSmsService $smsService */
            $smsService = app(BsnlSmsService::class);
            $sent = $smsService->sendOtp($phone, $otp);
        }

        return response()->json([
            'message'    => 'Verification OTP sent to +91 ' . $phone,
            'phone'      => $phone,
            'expires_in' => 600,
            'debug_otp'  => (config('app.debug') || $isDemo) ? $otp : null,
        ]);
    }

    /**
     * Verify OTP and Login or Register
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'otp'   => ['required', 'string'],
            'name'  => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $phone = BsnlSmsService::formatPhoneNumber($validated['phone']);
        $submittedOtp = trim($validated['otp']);

        $record = PhoneOtp::where('phone', $phone)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'No active OTP found for this number. Please request a new OTP.',
            ], 422);
        }

        if ($record->isExpired()) {
            return response()->json([
                'message' => 'This OTP has expired. Please request a new one.',
            ], 422);
        }

        if ($record->attempts >= 5) {
            return response()->json([
                'message' => 'Too many failed attempts. Please request a new OTP.',
            ], 429);
        }

        if ($record->otp !== $submittedOtp) {
            $record->increment('attempts');
            return response()->json([
                'message' => 'Incorrect OTP code. Please try again.',
            ], 422);
        }

        // Mark OTP as verified
        $record->update(['verified_at' => now()]);

        // Find or create user
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            $userName = trim($request->input('name', '')) ?: 'Listener ' . substr($phone, -4);
            $user = User::create([
                'name'              => $userName,
                'phone'             => $phone,
                'phone_verified_at' => now(),
                'role'              => 'LISTENER',
            ]);
        } else {
            if (!$user->phone_verified_at) {
                $user->update(['phone_verified_at' => now()]);
            }
            if ($request->filled('name') && empty($user->name)) {
                $user->update(['name' => $request->name]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => [
                'user'  => $user->load('artist'),
                'token' => $token,
            ],
            'message' => 'Authentication successful',
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'LISTENER',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user->load('artist'),
                'token' => $token,
            ],
            'message' => 'Registration successful',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
            ], 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user->load('artist'),
                'token' => $token,
            ],
            'message' => 'Login successful',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['artist', 'artistApplication']);

        return response()->json([
            'data' => [
                'user' => $user,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:1024'],
        ]);

        $user->update($validated);

        return response()->json([
            'data' => [
                'user' => $user->fresh()->load('artist'),
            ],
            'message' => 'Profile updated successfully',
        ]);
    }
}

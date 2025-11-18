<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserApiController extends Controller
{
    /**
     * List all users for administration.
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureAdminAccess($request);

        $users = User::orderBy('id')->get()->map(fn (User $user) => $this->transformUser($user));

        return response()->json([
            'status' => 'success',
            'data' => $users,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $this->ensureAdminAccess($request);

        $this->validateUser($request);

        $user = new User();
        $this->fillUserFromRequest($user, $request);
        $user->save();

        return response()->json([
            'status' => 'success',
            'data' => $this->transformUser($user),
            'message' => __('app.alert.success.user_created'),
        ], 201);
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureAdminAccess($request);

        $this->validateUser($request, $user->id);

        $this->fillUserFromRequest($user, $request, true);
        $user->save();

        return response()->json([
            'status' => 'success',
            'data' => $this->transformUser($user),
            'message' => __('app.alert.success.user_updated'),
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureAdminAccess($request);

        if ($user->id === 1) {
            return response()->json([
                'status' => 'error',
                'message' => __('app.unauthorized_for_form'),
            ], 422);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => __('app.alert.success.user_deleted'),
        ]);
    }

    /**
     * Validate incoming user payload.
     */
    protected function validateUser(Request $request, ?int $userId = null): array
    {
        $uniqueRule = 'unique:users,username';
        if ($userId) {
            $uniqueRule .= ',' . $userId;
        }

        return $request->validate([
            'username' => ['required', 'max:255', $uniqueRule],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'confirmed'],
            'password_confirmation' => ['nullable'],
            'file' => ['sometimes', 'image'],
            'avatar' => ['sometimes', 'image'],
        ]);
    }

    /**
     * Map request data onto the user instance.
     */
    protected function fillUserFromRequest(User $user, Request $request, bool $isUpdate = false): void
    {
        $user->username = $request->input('username');
        $user->email = $request->input('email');

        if ($request->has('public_front')) {
            $user->public_front = $request->boolean('public_front');
        } elseif (! $isUpdate && is_null($user->public_front)) {
            $user->public_front = true;
        }

        $password = $request->input('password');
        $clearPassword = $request->boolean('clear_password');

        if (! empty($password)) {
            $user->password = bcrypt($password);
        } elseif ($clearPassword && $isUpdate) {
            $user->password = null;
        }

        $uploadedFile = $request->file('avatar') ?? $request->file('file');
        if ($uploadedFile) {
            $path = $uploadedFile->store('avatars', 'public');
            $user->avatar = $path;
        }

        $autologinAllowed = $request->boolean('autologin_allow');
        if ($autologinAllowed) {
            $user->autologin = $user->autologin ?? (string) Str::uuid();
        } else {
            $user->autologin = null;
        }
    }

    /**
     * Transform a user for API responses.
     */
    protected function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'public_front' => (bool) $user->public_front,
            'autologin' => $user->autologin,
            'autologin_url' => $user->autologin ? route('user.autologin', $user->autologin) : null,
            'has_password' => ! empty($user->password),
            'can_delete' => $user->id !== 1,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }

    /**
     * Ensure the current session has permission to manage users.
     */
    protected function ensureAdminAccess(Request $request): void
    {
        if (config('app.auth_roles_enable')) {
            $headerKey = config('app.auth_roles_http_header');
            $header = $headerKey ? $request->server($headerKey) : null;
            if ($header) {
                $roles = array_map('trim', explode(config('app.auth_roles_delimiter'), $header));
                if (in_array(config('app.auth_roles_admin'), $roles, true)) {
                    return;
                }
            }
        } else {
            $currentUser = User::currentUser();
            if ($currentUser && $currentUser->getId() === 1) {
                return;
            }
        }

        throw new HttpResponseException(response()->json([
            'status' => 'error',
            'message' => __('app.unauthorized_for_form'),
        ], 403));
    }
}

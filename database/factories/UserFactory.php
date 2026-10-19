<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => Hash::make('laginghanda'),
            'role' => User::ROLE_STUDENT,
            'avatar_color' => '#2d6a4f',
            'bio' => 'New Scout on the trail and ready to learn.',
            'is_active' => true,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_ADMIN]);
    }

    public function teacher(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_TEACHER]);
    }
}

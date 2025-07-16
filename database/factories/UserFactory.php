<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $hasEmail = fake()->boolean(80); // 80% chance of having an email
        
        return [
            'name' => fake()->name(),
            'email' => $hasEmail ? fake()->safeEmail() : null,
            'email_verified_at' => $hasEmail ? now() : null,
            'password' => null, // No password for GitHub users
            'github_id' => fake()->unique()->randomNumber(8),
            'avatar_url' => fake()->imageUrl(200, 200, 'people'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}

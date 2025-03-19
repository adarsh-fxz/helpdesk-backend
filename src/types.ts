import { z } from 'zod';

export const CreateUserSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(3).max(50),
});

export const SignInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(3).max(50),
});
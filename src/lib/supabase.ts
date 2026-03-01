import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * Use this in "use client" components.
 */
export function createClient() {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Server-side Supabase client (for Server Components, Route Handlers, Server Actions).
 * Reads/writes auth cookies automatically via next/headers.
 */
export function createServerSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch {
                    // set() can only be called in a Server Action or Route Handler
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: "", ...options });
                } catch {
                    // set() can only be called in a Server Action or Route Handler
                }
            },
        },
    });
}

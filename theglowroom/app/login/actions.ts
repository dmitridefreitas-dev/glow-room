"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function originFrom(host: string | null): string {
  return host ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Log in with email + password (no email round-trip). */
export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  redirect("/dashboard");
}

/** Create an account with email + password. */
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Password must be at least 6 characters.")
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  // If "Confirm email" is OFF in Supabase, a session is returned immediately.
  if (data.session) {
    redirect("/dashboard");
  }
  // Otherwise the user must confirm via email first.
  redirect("/login?check=1");
}

/** Optional social login (requires the Google provider enabled in Supabase). */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = originFrom((await headers()).get("origin"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  if (data?.url) {
    redirect(data.url);
  }
}

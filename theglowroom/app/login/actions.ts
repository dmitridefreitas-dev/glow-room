"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function originFrom(host: string | null): string {
  return host ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Send a passwordless magic-link email. */
export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?error=" + encodeURIComponent("Please enter your email."));
  }

  const supabase = await createClient();
  const origin = originFrom((await headers()).get("origin"));

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  redirect("/login?sent=" + encodeURIComponent(email));
}

/** Start the Google OAuth flow. */
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

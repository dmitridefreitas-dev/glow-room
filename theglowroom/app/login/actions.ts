"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordReferral } from "@/lib/referral";

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

/**
 * Create an account with email + password.
 * Uses the service-role admin API to create the user already-confirmed, so no
 * verification email is ever sent and it works regardless of the project's
 * "Confirm email" setting. (In production, sign-up will be gated to paying
 * customers via the Stripe webhook — this open form is for pre-launch testing.)
 */
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Password must be at least 6 characters.")
    );
  }

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const alreadyExists = /registered|already|exists/i.test(
      createError.message
    );
    if (alreadyExists) {
      // Recover a previously-created (possibly unconfirmed) account: confirm it
      // so the password they choose here works. (Pre-launch convenience.)
      const { data: list } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = list?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          email_confirm: true,
        });
      }
    } else {
      redirect("/login?error=" + encodeURIComponent(createError.message));
    }
  }

  // Establish the session cookie via a normal password sign-in.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "That email already has an account with a different password. Use the password you first chose, or sign in."
        )
    );
  }

  // Referral attribution (R2): if they arrived via /r/<code>, credit the referrer.
  const jar = await cookies();
  const refCode = jar.get("gr_ref")?.value;
  if (refCode) {
    const {
      data: { user: newUser },
    } = await supabase.auth.getUser();
    if (newUser) await recordReferral(newUser.id, refCode);
    jar.delete("gr_ref");
  }

  redirect("/dashboard");
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

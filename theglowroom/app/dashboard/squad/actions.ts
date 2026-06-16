"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createSquad, joinSquad, leaveSquad } from "@/lib/squads";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function createSquadAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "");
  const res = await createSquad(user.id, name);
  if (!res.ok) {
    redirect("/dashboard/squad?error=" + encodeURIComponent(res.error ?? "failed"));
  }
  revalidatePath("/dashboard/squad");
  redirect("/dashboard/squad");
}

export async function joinSquadAction(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "");
  const res = await joinSquad(user.id, code);
  if (!res.ok) {
    redirect("/dashboard/squad?error=" + encodeURIComponent(res.error ?? "failed"));
  }
  revalidatePath("/dashboard/squad");
  redirect("/dashboard/squad");
}

export async function leaveSquadAction() {
  const user = await requireUser();
  await leaveSquad(user.id);
  revalidatePath("/dashboard/squad");
  redirect("/dashboard/squad");
}

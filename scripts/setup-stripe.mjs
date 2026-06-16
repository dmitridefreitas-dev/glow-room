// One-time Stripe + cohort setup for The Glow Room.
// Creates the Stripe products/prices (test mode) and a purchasable Glow Up
// cohort row, then prints the membership price id to add to .env.local.
//
// Run from the repo root:
//   node --env-file=.env.local scripts/setup-stripe.mjs
//
// Safe-ish to re-run: it creates new Stripe prices each time, so prefer running
// once. It upserts a single "Glow Up — Test Cohort" row by name.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const COHORT_NAME = "Glow Up — Test Cohort";

async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    console.error("Refusing to run: STRIPE_SECRET_KEY is not a test key.");
    process.exit(1);
  }

  // 1. Glow Up one-time product + $18 price
  const glowProduct = await stripe.products.create({
    name: "Glow Up Challenge (30 days)",
  });
  const glowPrice = await stripe.prices.create({
    product: glowProduct.id,
    currency: "usd",
    unit_amount: 1800,
  });

  // 2. Membership product + $9/mo price
  const memProduct = await stripe.products.create({
    name: "The Glow Room Monthly",
  });
  const memPrice = await stripe.prices.create({
    product: memProduct.id,
    currency: "usd",
    unit_amount: 900,
    recurring: { interval: "month" },
  });

  // 3. Purchasable cohort row (start tomorrow so the join flow makes sense)
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  const startDate = start.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("cohorts")
    .select("id")
    .eq("name", COHORT_NAME)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("cohorts")
      .update({ stripe_price_id: glowPrice.id, status: "open", start_date: startDate })
      .eq("id", existing.id);
  } else {
    await supabase.from("cohorts").insert({
      challenge_type: "glow_up",
      name: COHORT_NAME,
      start_date: startDate,
      status: "open",
      stripe_price_id: glowPrice.id,
    });
  }

  console.log("\n✅ Stripe + cohort setup complete.\n");
  console.log("Glow Up one-time price:", glowPrice.id);
  console.log("Membership price:      ", memPrice.id);
  console.log("\n>>> Add this line to .env.local:");
  console.log(`STRIPE_MEMBERSHIP_PRICE_ID=${memPrice.id}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

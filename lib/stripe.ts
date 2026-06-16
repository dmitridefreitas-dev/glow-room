import Stripe from "stripe";

/**
 * Server-side Stripe client, lazily initialised. Importing this module never
 * instantiates Stripe, so a missing STRIPE_SECRET_KEY can't crash the build
 * (Next evaluates route modules during "collect page data"). The real client is
 * created on first use at runtime, where the env var is present.
 */
let instance: Stripe | null = null;

function getClient(): Stripe {
  if (!instance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    instance = new Stripe(key);
  }
  return instance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});

export type { Stripe };

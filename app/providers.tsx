"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

let started = false;

/**
 * Initialises PostHog product analytics once on the client, then identifies the
 * logged-in user (so funnels/retention tie to a person). Autocapture + pageviews
 * give us the drop-off and engagement data that is the behavioural moat.
 */
export function AnalyticsInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || started) return;
    started = true;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      autocapture: true,
    });

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          posthog.identify(data.user.id, { email: data.user.email });
        }
      });
  }, []);

  return null;
}

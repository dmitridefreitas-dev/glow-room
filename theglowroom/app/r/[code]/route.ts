import { NextResponse } from "next/server";

/**
 * Referral capture (RECOMMENDATIONS R2). Stores the code in a cookie and sends
 * the visitor to the landing page; signup reads the cookie to attribute them.
 * An optional ?c=<cohortId> (R5 "bring your group") is preserved for /join.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { searchParams, origin } = new URL(request.url);
  const cohort = searchParams.get("c");

  const dest = new URL("/", origin);
  if (cohort) dest.searchParams.set("ref", "1");

  const res = NextResponse.redirect(dest);
  const THIRTY_DAYS = 60 * 60 * 24 * 30;
  res.cookies.set("gr_ref", code.toLowerCase().slice(0, 24), {
    maxAge: THIRTY_DAYS,
    path: "/",
    sameSite: "lax",
  });
  if (cohort) {
    res.cookies.set("gr_ref_cohort", cohort, {
      maxAge: THIRTY_DAYS,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}

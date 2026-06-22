"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Copy, Check, UserPlus, Award, Plus } from "lucide-react";
import { postImageToStory, copyText } from "./share-actions";

/**
 * R2/R3/R5 — referral + invite hub. Shows the member's referral link, how many
 * friends they've brought in (+ Recruiter badge), an "Invite a friend" action
 * that posts the QR invite card, and a "crew" invite: if the member is in a crew
 * it shares the crew join link; if not, it sends them to create one.
 */
export function InvitePanel({
  referralLink,
  inviteImageUrl,
  crewInviteLink,
  count,
  recruiter,
}: {
  referralLink: string;
  inviteImageUrl: string;
  /** The member's crew join link, or null if they haven't created/joined one. */
  crewInviteLink: string | null;
  count: number;
  recruiter: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // The featured link in the box: the crew join link if they're in a crew,
  // otherwise their personal referral link.
  const inCrew = Boolean(crewInviteLink);
  const featuredLink = crewInviteLink ?? referralLink;
  const featuredShort = featuredLink.replace(/^https?:\/\//, "");

  async function copyFeatured() {
    const ok = await copyText(
      featuredLink,
      inCrew ? "crew_invite_copied" : "referral_link_copied"
    );
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-light text-sage">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-spruce">Invite friends, glow together</h2>
          <p className="text-xs text-muted">
            Doing it together is how you finish. Bring a friend into your crew.
          </p>
        </div>
      </div>

      {/* Featured link — crew join link when in a crew, else the referral link */}
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-ivory px-3 py-2.5">
        <span className="flex-1 truncate text-sm font-medium text-spruce">
          {featuredShort}
        </span>
        <button
          onClick={copyFeatured}
          className="inline-flex items-center gap-1.5 rounded-lg bg-spruce px-3 py-1.5 text-xs font-semibold text-ivory transition hover:bg-spruce-dark"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {inCrew
          ? "Your crew link — friends open it and join your crew from their dashboard."
          : "Your invite link — anyone who joins with it is credited to you."}
      </p>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={async () => {
            setBusy(true);
            await postImageToStory(
              inviteImageUrl,
              `Come glow up with me 🌿 ${referralLink}`,
              "invite_card_shared"
            );
            setBusy(false);
          }}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? "Preparing…" : "Invite a friend"}
        </button>
        {!inCrew && (
          <Link
            href="/dashboard/squad"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-teal transition hover:border-teal"
          >
            <Plus className="h-4 w-4" /> Start a crew to invite
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 border-t border-line pt-4 text-sm">
        <span className="font-semibold text-spruce">
          {count} {count === 1 ? "friend" : "friends"} joined
        </span>
        {recruiter && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-honey-light px-3 py-1 text-xs font-semibold text-spruce">
            <Award className="h-3.5 w-3.5 text-honey" /> Recruiter badge earned
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copyText } from "./share-actions";

export function CopyButton({
  value,
  label = "Copy",
  event,
}: {
  value: string;
  label?: string;
  event?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copyText(value, event)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-spruce px-3 py-1.5 text-xs font-semibold text-ivory transition hover:bg-spruce-dark"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> {label}
        </>
      )}
    </button>
  );
}

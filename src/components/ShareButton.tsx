"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <button onClick={handleCopy} className="btn-secondary w-full">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-accent" /> Link copied
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" /> Copy link to share
        </>
      )}
    </button>
  );
}

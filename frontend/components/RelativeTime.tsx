"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/status";

/**
 * Renders a "X detik/menit/jam lalu" label that only computes on the client,
 * after mount. This avoids hydration mismatches: the server (and the
 * client's first pre-hydration render) both output the same placeholder,
 * and the real relative time is filled in via useEffect once mounted.
 */
export default function RelativeTime({ timestamp }: { timestamp: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatRelativeTime(timestamp));
    const interval = setInterval(() => {
      setLabel(formatRelativeTime(timestamp));
    }, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <>{label ?? "…"}</>;
}
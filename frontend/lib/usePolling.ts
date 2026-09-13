"use client";

import { useEffect, useRef } from "react";

export function usePolling(callback: () => void, intervalMs = 5000) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

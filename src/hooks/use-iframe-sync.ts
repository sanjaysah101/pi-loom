"use client";

import { useEffect } from "react";
/**
 * Hook to sync URL changes from a child Next.js app to a parent iframe host.
 * maintainer: Sanjay OS
 *
 * Usage:
 * 1. Copy this file to your child project (e.g., pi-loom)
 * 2. Import and call this hook in your root layout or top-level component.
 *
 * Example (src/app/layout.tsx):
 *
 * export default function RootLayout({ children }) {
 *   useIframeSync();
 *   return <html>...</html>
 * }
 */
export function useIframeSync() {
  useEffect(() => {
    // 1. Check if we are actually running inside an iframe
    const inIframe = window.parent !== window;
    if (!inIframe) return;

    // 2. Construct the full current URL
    // We use window.location.href to get the absolute URL including protocol/domain
    const url = window.location.href;
    console.log({url})

    // 3. Send message to parent
    window.parent.postMessage(
      {
        type: "URL_CHANGED",
        url: url,
      },
      "*" // For production, replace "*" with your specific OS domain for better security
    );

    // Debug log (optional)
    // console.log("Synced URL to parent:", url);
  }, []);
}

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const OS_ORIGIN = process.env.NEXT_PUBLIC_OS_ORIGIN;

type IframeRouterBridgeMessage = {
  type: "URL_CHANGED";
  payload: {
    url: string;
    pathname: string;
    search: string;
  };
};

/**
 * Hook to sync URL changes from a child Next.js app to a parent iframe host.
 * maintainer: Sanjay OS
 */
export function useIframeSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if inside iframe
    const inIframe = window.parent && window.parent !== window;
    if (!inIframe) return;

    // 2. Validate OS origin
    if (!OS_ORIGIN) {
      console.warn("[useIframeSync] NEXT_PUBLIC_OS_ORIGIN is not defined. Falling back to '*'");
    }

    // 3. Build URL
    const url = window.location.href;

    // 4. Send to parent
    window.parent.postMessage(
      {
        type: "URL_CHANGED",
        payload: {
          url,
          pathname,
          search: searchParams.toString(),
        },
      } satisfies IframeRouterBridgeMessage,
      OS_ORIGIN || "*"
    );
  }, [pathname, searchParams]);
}

"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const convex = useMemo(() => {
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not defined. Please set it in your environment variables.");
      // Return a dummy client to prevent crash, but log the error
      return new ConvexReactClient("https://dummy.convex.cloud");
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

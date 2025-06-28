"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import NProgress from "nprogress";

// Configure NProgress to be faster and less intrusive.
NProgress.configure({
  showSpinner: false, // The spinner is visually distracting
  speed: 200,         // Animation speed in ms
  trickleSpeed: 80,  // How often the bar advances
});

export function NProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);
  
  return <>{children}</>;
}

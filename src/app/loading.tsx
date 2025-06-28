"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  useEffect(() => {
    // Keep nprogress for the top bar, but disable its default spinner
    // since we're showing a custom, more prominent one.
    NProgress.configure({ showSpinner: false });
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </main>
  );
}

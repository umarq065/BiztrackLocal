"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';

export default function Loading() {
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return null;
}

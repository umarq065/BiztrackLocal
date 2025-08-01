
"use client";
import { redirect } from 'next/navigation';

export default function DetailedMetricsPage() {
  // Redirect to the default financial tab
  redirect('/detailed-metrics/financial');
}

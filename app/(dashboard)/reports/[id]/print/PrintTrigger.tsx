"use client";
import { useEffect } from "react";

// Auto-triggers the browser print dialog when the page loads.
// The user can then Save as PDF from the native dialog.
export default function PrintTrigger() {
  useEffect(() => {
    // Small delay so the page renders fully before the dialog opens
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return null;
}

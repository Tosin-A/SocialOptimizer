"use client";
// Captures ?ref=CODE from the URL and stores it in a 30-day cookie so the
// referral is preserved through signup and checkout.
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from "@/lib/referral";

export default function RefCapture() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref && /^[A-Z0-9]{6,12}$/.test(ref)) {
      document.cookie = `${REFERRAL_COOKIE}=${ref}; max-age=${REFERRAL_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    }
  }, [params]);

  return null;
}

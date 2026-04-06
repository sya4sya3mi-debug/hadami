"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Onboarding from "./Onboarding";

const STORAGE_KEY = "hadami_onboarding_done";

export default function OnboardingGate() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  if (!mounted || !show) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-bo-cream">
      <Onboarding
        onComplete={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setShow(false);
          router.push("/scan");
        }}
      />
    </div>
  );
}

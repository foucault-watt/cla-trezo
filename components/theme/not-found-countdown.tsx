"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const START_SECONDS = 5;

export function NotFoundCountdown() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push("/");
      return;
    }

    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 700);
    return () => clearTimeout(timeout);
  }, [secondsLeft, router]);

  return (
    <p className="flex items-center justify-center gap-2 text-base-content/70">
      Retour à l&apos;accueil dans
      <span className="countdown font-mono text-2xl text-primary">
        <span style={{ "--value": secondsLeft } as React.CSSProperties} aria-live="polite">
          {secondsLeft}
        </span>
      </span>
      seconde{secondsLeft > 0 ? "s" : ""}
    </p>
  );
}

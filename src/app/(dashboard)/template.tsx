"use client";

import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
      {children}
    </div>
  );
}

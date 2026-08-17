"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error("[root] Unhandled route error", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center"
      role="alert"
    >
      <h1 className="font-heading text-2xl sm:text-3xl">页面暂时无法加载</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        请稍后重试。如果问题持续存在，请刷新页面。
      </p>
      <Button type="button" className="mt-6" onClick={reset}>
        重试
      </Button>
    </div>
  );
}

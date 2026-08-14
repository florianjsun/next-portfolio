"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global] Unhandled application error", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          alignItems: "center",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "1.5rem",
        }}
      >
        <main role="alert" style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1>页面暂时无法加载</h1>
          <p>请稍后重试。如果问题持续存在，请刷新页面。</p>
          <button
            type="button"
            onClick={reset}
            style={{ cursor: "pointer", padding: "0.625rem 1rem" }}
          >
            重试
          </button>
        </main>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";

export const metadata = { title: "AI Chat", description: "18+ AI companions" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 16, background: "#0f0f14", color: "#eee" }}>
        {children}
      </body>
    </html>
  );
}

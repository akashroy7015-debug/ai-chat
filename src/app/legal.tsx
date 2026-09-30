import type { ReactNode } from "react";
import Link from "next/link";

export const OPERATOR = process.env.OPERATOR_NAME ?? "(set OPERATOR_NAME)";
export const SUPPORT_EMAIL = process.env.GRIEVANCE_OFFICER_EMAIL ?? "(set GRIEVANCE_OFFICER_EMAIL)";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ lineHeight: 1.6, maxWidth: 760 }}>
      <Link href="/" style={{ color: "#9a9aa8" }}>← Home</Link>
      <h1>{title}</h1>
      <p style={{ color: "#e0a060", fontSize: 13 }}>Template: have this reviewed by a lawyer before launch.</p>
      {children}
    </main>
  );
}

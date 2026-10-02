import type { ReactNode } from "react";
import Link from "next/link";

// Business details come from the server's environment so they can change without a code edit.
// Placeholder values (e.g. "your@email.com") are treated as not set.
const real = (v?: string) => (v && !/your|xxxx|example/i.test(v) ? v.trim() : "");
export const OPERATOR = real(process.env.OPERATOR_NAME) || "Sizzly";
export const SUPPORT_EMAIL_SET = real(process.env.SUPPORT_EMAIL) || real(process.env.GRIEVANCE_OFFICER_EMAIL) || "rizzlabsupport@gmail.com";
export const SUPPORT_EMAIL = SUPPORT_EMAIL_SET || "our support team";
export const SUPPORT_PHONE = real(process.env.SUPPORT_PHONE);
export const BUSINESS_ADDRESS = real(process.env.BUSINESS_ADDRESS) || "India";
export const UPDATED = "2 October 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ lineHeight: 1.6, maxWidth: 760, paddingBottom: 40 }}>
      <Link href="/" style={{ color: "#9a9aa8" }}>← Home</Link>
      <h1>{title}</h1>
      <p style={{ color: "#a79ca5", fontSize: 13 }}>Last updated: {UPDATED}</p>
      {children}
      <p style={{ marginTop: 32, fontSize: 13, color: "#a79ca5" }}>
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refunds &amp; Cancellation</Link> · <Link href="/contact">Contact us</Link> · <Link href="/grievance">Grievances</Link>
      </p>
    </main>
  );
}

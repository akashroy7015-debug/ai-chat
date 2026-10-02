import { BUSINESS_ADDRESS, LegalPage, OPERATOR, SUPPORT_EMAIL, SUPPORT_PHONE } from "../legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact Us" };

export default function Contact() {
  return (
    <LegalPage title="Contact Us">
      <p>Need help with your account, a payment or a refund? We&apos;re happy to help.</p>
      <h2>Support</h2>
      <ul>
        <li><b>Email:</b> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
        {SUPPORT_PHONE && <li><b>Phone:</b> {SUPPORT_PHONE} (Mon–Sat, 10 am – 6 pm IST)</li>}
        <li><b>Response time:</b> within 2 working days</li>
      </ul>
      <h2>Business details</h2>
      <ul>
        <li><b>Operated by:</b> {OPERATOR}</li>
        <li><b>Address:</b> {BUSINESS_ADDRESS}</li>
      </ul>
      <h2>Other help</h2>
      <ul>
        <li>Refunds and cancellations: see our <a href="/refund">Refund &amp; Cancellation Policy</a>.</li>
        <li>Complaints about content: see the <a href="/grievance">Grievance page</a>.</li>
      </ul>
    </LegalPage>
  );
}

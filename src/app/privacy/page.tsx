import { LegalPage, OPERATOR, SUPPORT_EMAIL } from "../legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>This policy explains what personal data FlirtIQ collects, why, and your rights. {OPERATOR} is the data fiduciary under India&apos;s Digital Personal Data Protection Act, 2023 (and controller under the GDPR where it applies).</p>

      <h2>1. What we collect</h2>
      <ul>
        <li><b>Account:</b> your email address and a securely hashed password (we never store your password itself).</li>
        <li><b>Age check:</b> your date of birth and your confirmation that you are 18 or older. We do not collect Aadhaar numbers or ID documents.</li>
        <li><b>Usage:</b> your chats with AI characters, characters you create, media you request, things a character remembers from your chats, your credit and purchase history, and safety reports.</li>
        <li><b>Payments:</b> payments are handled by our payment partner. We receive only the payment status, amount and a reference number. We never see or store your card, UPI or bank details.</li>
        <li><b>Technical:</b> approximate country from your connection, device and browser type, and notification settings if you turn notifications on.</li>
      </ul>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To run your account and the chat service, and to remember your conversations.</li>
        <li>To keep the service 18+ only and to prevent abuse, fraud and illegal content.</li>
        <li>To process purchases, provide support and meet legal and tax obligations.</li>
        <li>To send notifications you have switched on (you can switch them off any time).</li>
      </ul>
      <p>We do <b>not</b> sell your personal data and do not use it for third-party advertising.</p>

      <h2>3. Who we share it with</h2>
      <ul>
        <li><b>AI providers</b> that generate character replies, voice and images, only to provide the service.</li>
        <li><b>Payment partner</b> to process your payments.</li>
        <li><b>Hosting provider</b> that stores the service&apos;s data securely.</li>
        <li><b>Authorities</b> when required by law, including reporting content that suggests child abuse.</li>
      </ul>

      <h2>4. Cookies</h2>
      <p>We use one essential cookie to keep you logged in, and your browser&apos;s local storage for small settings such as language. We do not use advertising or tracking cookies.</p>

      <h2>5. Security and retention</h2>
      <p>Data is sent over encrypted HTTPS and passwords are hashed. We keep your data while your account is open. When you delete your account we delete your chats and personal data within 30 days, except records we must keep by law (such as payment and safety records).</p>

      <h2>6. Your rights</h2>
      <p>You can ask to access, correct or delete your data, or withdraw consent, by emailing <b>{SUPPORT_EMAIL}</b> from your account email. We reply within 30 days. You may also complain to the Data Protection Board of India.</p>

      <h2>7. Adults only</h2>
      <p>FlirtIQ is only for people aged 18 or over. We do not knowingly collect data from anyone under 18; if we learn we have, we delete the account.</p>

      <h2>8. Changes</h2>
      <p>We may update this policy. The date at the top shows the latest version, and significant changes are announced in the app.</p>

      <h2>9. Contact</h2>
      <p>Privacy questions: {SUPPORT_EMAIL}. Complaints: see our <a href="/grievance">Grievance page</a>.</p>
    </LegalPage>
  );
}

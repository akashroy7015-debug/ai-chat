import { LegalPage, SUPPORT_EMAIL } from "../legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refund & Cancellation Policy" };

export default function Refund() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <p>We want you to be happy with Sizzly. This policy explains how cancellations and refunds work for Premium membership and gems.</p>

      <h2>1. Cancelling Premium</h2>
      <ul>
        <li>You can cancel your Premium membership at any time by emailing {SUPPORT_EMAIL} from the email on your account.</li>
        <li>When you cancel, any automatic renewal stops. You keep Premium until the end of the period you already paid for; we do not charge you again.</li>
        <li>Cancelling does not delete your account or your chats.</li>
      </ul>

      <h2>2. Refunds for Premium</h2>
      <ul>
        <li><b>First purchase:</b> if you are not satisfied, you can ask for a full refund within <b>48 hours</b> of your first Premium payment, as long as you have used fewer than 20 messages or features since paying.</li>
        <li><b>Automatic renewals:</b> if your plan renewed and you forgot to cancel, write to us within <b>48 hours</b> of the renewal charge and we will refund it if Premium has not been used since the renewal.</li>
        <li>Partial refunds for unused days of a period are not provided, except where required by law.</li>
      </ul>

      <h2>3. Gems</h2>
      <ul>
        <li>Gem purchases are refundable within <b>48 hours</b> if none of the purchased gems have been spent.</li>
        <li>Gems spent on a photo, video or voice note that fails to generate or is blocked by our safety systems are returned to your balance automatically.</li>
        <li>Gems have no cash value and cannot be exchanged for money.</li>
      </ul>

      <h2>4. Payment problems</h2>
      <p>If you were charged twice, charged the wrong amount, or paid but did not receive Premium or gems, email us with your payment reference. We will fix it or refund the extra charge in full.</p>

      <h2>5. When refunds are not given</h2>
      <p>Refunds are not given for accounts suspended for breaking our <a href="/terms">Terms</a>, or after the time limits above, except where the law requires.</p>

      <h2>6. How to request a refund</h2>
      <p>Email <b>{SUPPORT_EMAIL}</b> from the email on your account with the subject &quot;Refund&quot;, the date of payment and the payment reference. We reply within 2 working days.</p>

      <h2>7. How refunds are paid</h2>
      <p>Approved refunds go back to the original payment method (card, UPI, net banking or wallet). They are processed within <b>5–7 working days</b>; your bank may take a few more days to show the credit.</p>
    </LegalPage>
  );
}

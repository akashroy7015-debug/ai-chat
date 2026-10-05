import { LegalPage, SUPPORT_EMAIL } from "../legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refund & Cancellation Policy" };

export default function Refund() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <p>This policy explains how Premium membership, gems, cancellations and refunds work on FlirtIQ. Please read it before you buy.</p>

      <h2>1. No automatic renewal</h2>
      <p>Premium plans are one-time payments for a fixed period (1, 3 or 12 months). <b>They do not renew automatically</b> and we never charge you again without your action. When your plan ends, your account simply returns to the free plan. You can buy Premium again any time.</p>

      <h2>2. Cancelling</h2>
      <ul>
        <li>You can cancel your membership at any time by emailing {SUPPORT_EMAIL} from the email on your account.</li>
        <li>After cancelling you keep Premium until the end of the period you paid for.</li>
        <li>Cancelling does not delete your account or chats. To delete your account, ask us by email.</li>
      </ul>

      <h2>3. No refunds</h2>
      <p>Because Premium and gems give you instant access to digital features, <b>all purchases are final and non-refundable</b>, including for unused days of a plan or unused gems, except in the cases listed in section 4.</p>

      <h2>4. When we do refund or fix a payment</h2>
      <ul>
        <li><b>Duplicate or wrong charge:</b> if you were charged twice or the wrong amount, we refund the extra amount in full.</li>
        <li><b>Paid but not received:</b> if your payment went through but you did not get Premium or gems, we either add them to your account or refund you.</li>
        <li><b>Failed media:</b> gems spent on a photo, video or voice note that fails to generate or is blocked by our safety systems are returned to your gem balance automatically.</li>
        <li>Where a refund is required by applicable law.</li>
      </ul>

      <h2>5. Gems</h2>
      <p>Gems are a virtual in-app currency. They have no cash value, cannot be exchanged for money and cannot be transferred to another account.</p>

      <h2>6. Payment issues</h2>
      <p>Email <b>{SUPPORT_EMAIL}</b> with the subject &quot;Payment issue&quot;, the date of payment and the payment reference. We reply within 2 working days. Approved refunds go back to the original payment method (card, UPI, net banking or wallet) within <b>5–7 working days</b>; your bank may take a few more days to show the credit.</p>
    </LegalPage>
  );
}

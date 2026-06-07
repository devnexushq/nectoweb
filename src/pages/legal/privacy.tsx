import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { useSeo } from "@/lib/seo";

export default function PrivacyPolicy() {
  useSeo({
    title: "Privacy Policy — NECTO",
    description: "How NECTO collects, uses, and protects your personal data.",
    canonical: "/privacy-policy",
  });

  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="Last Updated: June 2026"
      intro={
        <>
          <p>Please read carefully before using Necto.</p>
          <p className="mt-2">
            Effective Date: June 2026<br />
            Platform: Necto — Discover Local, Buy Local
          </p>
        </>
      }
    >
      <LegalSection number={1} title="Introduction">
        <p>
          Necto is committed to protecting your personal data in accordance with Information
          Technology Act 2000 and Digital Personal Data Protection Act 2023.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Information We Collect">
        <p className="font-semibold">For Customers:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full Name, Area, Phone Number</li>
        </ul>
        <p className="font-semibold mt-3">For Workers:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full Name, Job Type, Experience</li>
          <li>Phone, WhatsApp, Description</li>
          <li>Area, Visibility, Business Hours</li>
        </ul>
        <p className="font-semibold mt-3">For Shop Owners:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Owner Name, Shop Name, Category</li>
          <li>Phone, WhatsApp, Description</li>
          <li>Area, Visibility, Business Hours</li>
          <li>Products listed</li>
        </ul>
      </LegalSection>

      <LegalSection number={3} title="How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To display your profile to users</li>
          <li>To connect customers with workers and shops</li>
          <li>To improve our platform</li>
          <li>We never sell your data</li>
        </ul>
      </LegalSection>

      <LegalSection number={4} title="Data Storage and Security">
        <ul className="list-disc pl-5 space-y-1">
          <li>Stored securely using industry-grade cloud infrastructure</li>
          <li>Industry standard security measures</li>
          <li>Compliant with Indian law</li>
        </ul>
      </LegalSection>

      <LegalSection number={5} title="Data Sharing">
        <p>We do not share your data except:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>When required by law</li>
          <li>With your explicit consent</li>
        </ul>
      </LegalSection>

      <LegalSection number={6} title="Your Rights">
        <p>Under DPDP Act 2023:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p className="mt-2">
          Contact:{" "}
          <a className="text-primary underline" href="mailto:support@necto.in">
            support@necto.in
          </a>
        </p>
      </LegalSection>

      <LegalSection number={7} title="Third Party Services">
        <ul className="list-disc pl-5 space-y-1">
          <li>Secure cloud backend for data storage</li>
          <li>WhatsApp for communication (redirects only, no data shared)</li>
        </ul>
      </LegalSection>

      <LegalSection number={8} title="Cookies">
        <p>Necto uses localStorage only. No tracking cookies used.</p>
      </LegalSection>

      <LegalSection number={9} title="Children's Privacy">
        <p>Necto is not for users under 18. We do not collect data from minors.</p>
      </LegalSection>

      <LegalSection number={10} title="Changes to This Policy">
        <p>We may update this policy anytime. Continued use means acceptance.</p>
      </LegalSection>

      <LegalSection number={11} title="Contact">
        <p>
          Email:{" "}
          <a className="text-primary underline" href="mailto:support@necto.in">
            support@necto.in
          </a>
          <br />
          Platform: necto.in
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

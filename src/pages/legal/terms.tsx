import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { useSeo } from "@/lib/seo";

export default function TermsAndConditions() {
  useSeo({
    title: "Terms & Conditions — NECTO",
    description:
      "NECTO Terms & Conditions. Please read carefully before using the platform.",
    canonical: "/terms-and-conditions",
  });

  return (
    <LegalLayout
      title="Terms & Conditions"
      lastUpdated="Last Updated: June 2026"
      intro={
        <>
          <p>These terms are legally binding. Please read carefully before using Necto.</p>
          <p className="mt-2">
            Effective Date: June 2026<br />
            Platform: Necto — Discover Local, Buy Local<br />
            Jurisdiction: Sundargarh, Odisha, India
          </p>
        </>
      }
    >
      <LegalSection number={1} title="Acceptance of Terms">
        <p>
          By accessing or registering on Necto, you agree to be bound by these Terms and
          Conditions. These terms apply to all users including Customers, Workers, and Shop
          Owners.
        </p>
      </LegalSection>

      <LegalSection number={2} title="About Necto">
        <p>
          Necto is a hyperlocal marketplace platform designed to connect local customers with
          skilled workers and local businesses in Tier-2 and Tier-3 cities across India.
        </p>
      </LegalSection>

      <LegalSection number={3} title="User Eligibility">
        <ul className="list-disc pl-5 space-y-1">
          <li>Must be 18 years of age or older</li>
          <li>Must provide accurate and complete information during registration</li>
          <li>One account per individual or business</li>
          <li>Must have a valid Indian phone number</li>
        </ul>
      </LegalSection>

      <LegalSection number={4} title="User Obligations">
        <p>All users agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide truthful and accurate information at all times</li>
          <li>Not impersonate any person or business</li>
          <li>Not list any illegal services</li>
          <li>Maintain respectful communication</li>
          <li>Not misuse the platform in any way</li>
        </ul>
      </LegalSection>

      <LegalSection number={5} title="Necto's Role">
        <p>
          Necto acts solely as an intermediary. We do not guarantee quality of any service, are
          not party to any transaction, and are not responsible for any loss from user
          interactions.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Listing Guidelines">
        <p>Workers and Shop Owners agree that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>All listed services must be legal</li>
          <li>Contact information must be accurate</li>
          <li>Business descriptions must be truthful</li>
          <li>Photos uploaded must be genuine</li>
        </ul>
      </LegalSection>

      <LegalSection number={7} title="Our Rights">
        <p>Necto reserves the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Remove any listing without notice</li>
          <li>Suspend or terminate any account</li>
          <li>Modify the platform at any time</li>
          <li>Update these terms at any time</li>
        </ul>
      </LegalSection>

      <LegalSection number={8} title="Intellectual Property">
        <p>
          All content, design, and branding of Necto is intellectual property of Necto and may
          not be copied without permission.
        </p>
      </LegalSection>

      <LegalSection number={9} title="Dispute Resolution">
        <p>All disputes governed by laws of India. Jurisdiction: Sundargarh, Odisha.</p>
      </LegalSection>

      <LegalSection number={10} title="Contact">
        <p>
          Email:{" "}
          <a className="text-primary underline" href="mailto:support@necto.in">
            support@necto.in
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

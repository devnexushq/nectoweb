## Objective
Add two new round support icons (Phone Support and WhatsApp Support) next to the existing Contact Necto icon, keeping the existing icon, layout, and behavior completely untouched.

## Current State
- `src/components/SupportFab.tsx` renders a single `HelpCircle` FAB at `fixed bottom-20 right-4` that opens a contact form modal.
- `src/components/AppShell.tsx` imports and renders `<SupportFab />` above `<BottomNav />`.

## Proposed Changes

### 1. New Component: `src/components/PhoneSupportFab.tsx`
- Round button: `h-12 w-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition`, positioned at `fixed bottom-20 right-20 z-30`.
- Icon: `Phone` from `lucide-react`, size `h-6 w-6`.
- Click opens a modal overlay with:
  - Title: "Phone Support"
  - Two entries:
    - `+91 96684 74374` with a "Call Now" button (`tel:+919668474374`)
    - `+91 91131 37533` with a "Call Now" button (`tel:+919113137533`)
  - Close button (X) in the header.
- Modal styling matches the existing SupportFab modal (black/40 overlay, white rounded-2xl card, max-w-md, centered on desktop, bottom-sheet-like on mobile).

### 2. New Component: `src/components/WhatsAppSupportFab.tsx`
- Round button: `h-12 w-12 rounded-full bg-whatsapp text-white shadow-lg flex items-center justify-center hover:bg-[#1fb955] transition`, positioned at `fixed bottom-20 right-36 z-30`.
- Icon: `MessageCircle` from `lucide-react`, size `h-6 w-6`.
- Click opens a modal overlay with:
  - Title: "WhatsApp Support"
  - Two entries:
    - `+91 96684 74374` with a "Chat on WhatsApp" button linking to `https://wa.me/919668474374?text=Hello%20Necto%20Support%2C%20I%20need%20assistance.`
    - `+91 91131 37533` with a "Chat on WhatsApp" button linking to `https://wa.me/919113137533?text=Hello%20Necto%20Support%2C%20I%20need%20assistance.`
  - Close button (X) in the header.
- Same modal styling as existing SupportFab.

### 3. Update `src/components/AppShell.tsx`
- Import `PhoneSupportFab` and `WhatsAppSupportFab`.
- Render them in the layout alongside `<SupportFab />`.
- No changes to `SupportFab.tsx` itself.

### 4. Verification Steps
- Build passes with no errors.
- Existing Contact Necto icon position, appearance, and modal behavior remain identical.
- Phone FAB opens its modal; both Call Now buttons trigger `tel:` links.
- WhatsApp FAB opens its modal; both Chat on WhatsApp buttons open WhatsApp with the prefilled message.
- All three icons are `h-12 w-12`, round, shadowed, and use the same hover transition.
- No labels, no extra text on the main screen.

## Safety
- Zero modifications to `SupportFab.tsx` — existing functionality is fully preserved.
- No backend, database, routing, or auth changes.
- Purely additive frontend change; no risk of regression to existing flows.
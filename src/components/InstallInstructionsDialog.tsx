import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getBrowserName, isAndroid, isIOS } from "@/lib/pwa";

export function InstallInstructionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const browser = typeof navigator !== "undefined" ? getBrowserName() : "other";
  const ios = typeof navigator !== "undefined" && isIOS();
  const android = typeof navigator !== "undefined" && isAndroid();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install Necto on your device</DialogTitle>
          <DialogDescription>Add Necto to your home screen for an app-like experience.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {ios && (
            <Section title="Safari on iPhone / iPad">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Tap the <strong>Share</strong> icon at the bottom.</li>
                <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right.</li>
              </ol>
            </Section>
          )}
          {android && browser === "chrome" && (
            <Section title="Chrome on Android">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Tap the <strong>⋮</strong> menu in the top right.</li>
                <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm <strong>Install</strong>.</li>
              </ol>
            </Section>
          )}
          {android && browser === "samsung" && (
            <Section title="Samsung Internet">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Tap the <strong>menu</strong> (☰) at the bottom.</li>
                <li>Tap <strong>Add page to</strong> → <strong>Home screen</strong>.</li>
                <li>Confirm <strong>Add</strong>.</li>
              </ol>
            </Section>
          )}
          {!ios && !android && (
            <Section title="Desktop (Chrome / Edge)">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click the <strong>install</strong> icon (⊕) in the address bar.</li>
                <li>Or open the browser menu and choose <strong>Install Necto</strong>.</li>
                <li>Confirm <strong>Install</strong>.</li>
              </ol>
            </Section>
          )}
          {!ios && !android && browser === "firefox" && (
            <Section title="Firefox">
              <p>Firefox on desktop does not support installable PWAs. Use Chrome or Edge for installation.</p>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="font-semibold mb-2 text-primary">{title}</div>
      {children}
    </div>
  );
}

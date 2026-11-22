import { useEffect, useState } from "react";
import { Phone, X } from "lucide-react";

const NUMBERS = [
  { display: "+91 96684 74374", tel: "+919668474374" },
  { display: "+91 62077 14514", tel: "+916207714514" },
];

export function PhoneSupportFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Phone Support"
        className="fixed bottom-20 right-20 z-30 h-12 w-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition"
      >
        <Phone className="h-6 w-6" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-support-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="phone-support-title" className="text-lg font-bold">
                Phone Support
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {NUMBERS.map((n) => (
                <div
                  key={n.tel}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border"
                >
                  <span className="font-medium text-sm sm:text-base">{n.display}</span>
                  <a
                    href={`tel:${n.tel}`}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition"
                  >
                    Call Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

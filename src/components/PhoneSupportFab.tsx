import { useState } from "react";
import { Phone, X } from "lucide-react";

const NUMBERS = [
  { display: "+91 96684 74374", tel: "+919668474374" },
  { display: "+91 91131 37533", tel: "+919113137533" },
];

export function PhoneSupportFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Phone Support"
        className="fixed bottom-20 right-20 z-30 h-12 w-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition"
      >
        <Phone className="h-6 w-6" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Phone Support</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {NUMBERS.map((n) => (
                <div
                  key={n.tel}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border"
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

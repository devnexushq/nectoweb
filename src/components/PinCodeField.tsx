import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, MapPin } from "lucide-react";

interface PostOfficeItem {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

interface IndiaPostResponseItem {
  Message: string;
  Status: "Success" | "Error";
  PostOffice: PostOfficeItem[] | null;
}

export function PinCodeField({
  pincode,
  onPincodeChange,
  onAreaResolved,
}: {
  pincode: string;
  onPincodeChange: (pin: string) => void;
  onAreaResolved: (area: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [offices, setOffices] = useState<PostOfficeItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedPinRef = useRef<string>("");

  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, "");

    if (cleanPin.length < 6) {
      setStatusMessage(null);
      setOffices([]);
      setLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (cleanPin.length === 6 && cleanPin !== lastFetchedPinRef.current) {
      lastFetchedPinRef.current = cleanPin;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setStatusMessage(null);

      fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          const data: IndiaPostResponseItem[] = await res.json();
          const first = data?.[0];

          if (
            first &&
            first.Status === "Success" &&
            first.PostOffice &&
            first.PostOffice.length > 0
          ) {
            const list = first.PostOffice;
            setOffices(list);

            // Find primary delivery or head post office, or fallback to first
            const primary =
              list.find((p) => p.DeliveryStatus === "Delivery" || p.BranchType?.includes("Head")) ||
              list[0];

            let resolvedName = primary.Name.trim();
            const district = primary.District?.trim();
            if (district && district.toLowerCase() !== resolvedName.toLowerCase()) {
              resolvedName = `${resolvedName}, ${district}`;
            }

            onAreaResolved(resolvedName);
            setStatusMessage(`Auto-filled: ${resolvedName}`);
          } else {
            setOffices([]);
            setStatusMessage(
              "Area not found for this PIN code. Please type your area manually below.",
            );
          }
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.warn("[PinCodeHelper] Lookup failed:", err);
          setOffices([]);
          setStatusMessage("Could not auto-fill area. Please type your area manually below.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [pincode, onAreaResolved]);

  function handleSelectOffice(office: PostOfficeItem) {
    let resolved = office.Name.trim();
    const district = office.District?.trim();
    if (district && district.toLowerCase() !== resolved.toLowerCase()) {
      resolved = `${resolved}, ${district}`;
    }
    onAreaResolved(resolved);
    setStatusMessage(`Selected: ${resolved}`);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="pincode-helper-input" className="text-sm font-medium block">
        Enter your PIN code to auto-fill your area
      </label>
      <div className="relative">
        <input
          id="pincode-helper-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="e.g. 757001"
          value={pincode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            onPincodeChange(val);
          }}
          className="w-full h-11 px-3 pr-10 rounded-lg border border-border focus:border-primary outline-none text-sm transition"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : statusMessage && statusMessage.startsWith("Auto-filled") ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">or type your area manually below</p>

      {/* Subtle feedback message */}
      {statusMessage && (
        <p
          className={`text-xs flex items-center gap-1 ${
            statusMessage.startsWith("Auto-filled") || statusMessage.startsWith("Selected")
              ? "text-emerald-700 font-medium"
              : "text-amber-700"
          }`}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{statusMessage}</span>
        </p>
      )}

      {/* Alternative locality pills in case multiple post offices exist in this PIN code */}
      {offices.length > 1 && (
        <div className="pt-1">
          <p className="text-[11px] text-muted-foreground mb-1">
            Tap a specific locality in this PIN if preferred:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {offices.slice(0, 8).map((po, idx) => (
              <button
                type="button"
                key={`${po.Name}-${idx}`}
                onClick={() => handleSelectOffice(po)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition border border-border text-foreground"
              >
                {po.Name.trim()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

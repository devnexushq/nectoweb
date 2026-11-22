import { useId } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Visibility = "local" | "all_india";

export function VisibilitySelector({
  visibility,
  setVisibility,
  disabled,
}: {
  visibility: Visibility;
  setVisibility: (v: Visibility) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="text-sm font-medium block">Discovery Visibility</span>
      <div className="mt-1 inline-flex rounded-lg bg-muted p-1 text-sm font-semibold" role="group">
        {(["local", "all_india"] as Visibility[]).map((v) => (
          <button
            type="button"
            key={v}
            disabled={disabled}
            aria-pressed={visibility === v}
            onClick={() => setVisibility(v)}
            className={`px-4 py-2 rounded-md transition ${
              visibility === v ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            {v === "local" ? "Local Only (PIN Match)" : "All India"}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {visibility === "local"
          ? "Appears only to viewers whose saved PIN code matches yours."
          : "Appears in the All India section regardless of viewer PIN code."}
      </p>
    </div>
  );
}

export function HoursAndVisibility({
  hours,
  setHours,
  visibility,
  setVisibility,
}: {
  hours: { from: string; to: string; days: string[] };
  setHours: (h: { from: string; to: string; days: string[] }) => void;
  visibility: Visibility;
  setVisibility: (v: Visibility) => void;
}) {
  function toggleDay(d: string) {
    setHours({
      ...hours,
      days: hours.days.includes(d) ? hours.days.filter((x) => x !== d) : [...hours.days, d],
    });
  }
  return (
    <>
      <VisibilitySelector visibility={visibility} setVisibility={setVisibility} />

      <div>
        <span className="text-sm font-medium">Business Hours</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="time"
            aria-label="Opening time"
            value={hours.from}
            onChange={(e) => setHours({ ...hours, from: e.target.value })}
            className="h-11 px-3 rounded-lg border border-border focus:border-primary outline-none"
          />
          <input
            type="time"
            aria-label="Closing time"
            value={hours.to}
            onChange={(e) => setHours({ ...hours, to: e.target.value })}
            className="h-11 px-3 rounded-lg border border-border focus:border-primary outline-none"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Working days">
          {DAYS.map((d) => {
            const selected = hours.days.includes(d);
            return (
              <button
                type="button"
                key={d}
                aria-pressed={selected}
                onClick={() => toggleDay(d)}
                className={`px-3 py-2 rounded-full text-xs font-semibold border transition ${
                  selected
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted-foreground border-border"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, id, ...rest } = props;
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className="mt-1 w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none"
      />
    </div>
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string },
) {
  const { label, id, ...rest } = props;
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <div>
      <label htmlFor={textareaId} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={textareaId}
        {...rest}
        rows={3}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-border focus:border-primary outline-none"
      />
    </div>
  );
}

export { DAYS };

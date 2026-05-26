import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Visibility = "local" | "all_india";

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
      <div>
        <label className="text-sm font-medium">Visibility</label>
        <div className="mt-1 inline-flex rounded-lg bg-muted p-1 text-sm font-semibold">
          {(["local", "all_india"] as Visibility[]).map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setVisibility(v)}
              className={`px-4 py-2 rounded-md transition ${
                visibility === v ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
              }`}
            >
              {v === "local" ? "Local Only" : "All India"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Business Hours</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input type="time" value={hours.from} onChange={(e) => setHours({ ...hours, from: e.target.value })} className="h-11 px-3 rounded-lg border border-border focus:border-primary outline-none" />
          <input type="time" value={hours.to} onChange={(e) => setHours({ ...hours, to: e.target.value })} className="h-11 px-3 rounded-lg border border-border focus:border-primary outline-none" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => toggleDay(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                hours.days.includes(d) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input {...rest} className="mt-1 w-full h-11 px-3 rounded-lg border border-border focus:border-primary outline-none" />
    </div>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea {...rest} rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-border focus:border-primary outline-none" />
    </div>
  );
}

export { DAYS };

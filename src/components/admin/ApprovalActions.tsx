import { useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

type Props = {
  table: "workers" | "shops" | "customers";
  id: string;
  currentStatus: string | null;
  onStatusUpdated?: () => void;
};

const STATUS_OPTIONS: {
  value: "approved" | "pending" | "suspended" | "rejected";
  label: string;
  icon: typeof CheckCircle2;
  color: string;
}[] = [
  {
    value: "approved",
    label: "Approve",
    icon: CheckCircle2,
    color: "text-emerald-600 hover:bg-emerald-50",
  },
  { value: "pending", label: "Pending", icon: Clock, color: "text-amber-600 hover:bg-amber-50" },
  {
    value: "suspended",
    label: "Suspend",
    icon: AlertCircle,
    color: "text-orange-600 hover:bg-orange-50",
  },
  { value: "rejected", label: "Reject", icon: XCircle, color: "text-rose-600 hover:bg-rose-50" },
];

export default function ApprovalActions({ table, id, currentStatus, onStatusUpdated }: Props) {
  const [busy, setBusy] = useState(false);

  const setStatus = async (newStatus: "approved" | "pending" | "suspended" | "rejected") => {
    if (newStatus === currentStatus) return;
    setBusy(true);
    try {
      await adminApi.updateApprovalStatus(table, id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      onStatusUpdated?.();
    } catch (err) {
      toast.error((err as Error).message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        disabled={busy}
        value={currentStatus ?? "pending"}
        onChange={(e) =>
          setStatus(e.target.value as "approved" | "pending" | "suspended" | "rejected")
        }
        className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-800 font-medium outline-none focus:border-slate-400 disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

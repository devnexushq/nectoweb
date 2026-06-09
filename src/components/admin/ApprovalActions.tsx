import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Ban } from "lucide-react";
import { adminApi, EntityType } from "@/lib/admin/api";
import { toast } from "sonner";

export default function ApprovalActions({
  entity, id, currentStatus, onChanged,
}: {
  entity: EntityType;
  id: string;
  currentStatus: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      toast.success(`${label} done`);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm" variant="outline"
        className="h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
        disabled={busy !== null || currentStatus === "approved"}
        onClick={() => run("Approve", () => adminApi.approve(entity, id))}
      >
        <Check className="h-3.5 w-3.5 mr-1" /> Approve
      </Button>
      <Button
        size="sm" variant="outline"
        className="h-7 px-2 text-rose-700 border-rose-200 hover:bg-rose-50"
        disabled={busy !== null || currentStatus === "rejected"}
        onClick={() => run("Reject", () => adminApi.reject(entity, id))}
      >
        <X className="h-3.5 w-3.5 mr-1" /> Reject
      </Button>
      <Button
        size="sm" variant="outline"
        className="h-7 px-2 text-slate-700 border-slate-300 hover:bg-slate-100"
        disabled={busy !== null || currentStatus === "suspended"}
        onClick={() => run("Suspend", () => adminApi.suspend(entity, id))}
      >
        <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
      </Button>
    </div>
  );
}

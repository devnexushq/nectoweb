import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, TextArea } from "@/components/FormBits";
import { supabase } from "@/integrations/supabase/client";
import { clearAccount, getUserId, type Role } from "@/lib/role";

type Props = {
  role: Role;
  me: any;
  lockDaysLeft: number;
  onUpdated: (updated: any) => void;
};

const TABLE: Record<Role, "customers" | "workers" | "shops"> = {
  customer: "customers",
  worker: "workers",
  shop: "shops",
};

export function ProfileActions({ role, me, lockDaysLeft, onUpdated }: Props) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [form, setForm] = useState<any>(me);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const locked = role !== "customer" && lockDaysLeft > 0;

  function openEdit() {
    setForm(me);
    setEditOpen(true);
  }

  async function save() {
    const id = getUserId();
    if (!id) return;
    setSaving(true);
    const { id: _omit, registered_at, created_at, rating, ...patch } = form ?? {};
    const { data, error } = await supabase
      .from(TABLE[role])
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error("Could not save changes");
    toast.success("Profile updated");
    setEditOpen(false);
    if (data) onUpdated(data);
  }

  async function doDelete() {
    const id = getUserId();
    if (!id) return;
    setDeleting(true);
    const { error } = await supabase.from(TABLE[role]).delete().eq("id", id);
    setDeleting(false);
    if (error) return toast.error("Could not delete profile");
    clearAccount();
    toast.success("Profile deleted");
    navigate("/");
  }

  return (
    <>
      <button
        onClick={openEdit}
        disabled={locked}
        className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {locked ? (
          <>
            <Lock className="h-4 w-4" /> Edit unlocks in {lockDaysLeft} day
            {lockDaysLeft === 1 ? "" : "s"}
          </>
        ) : (
          <>
            <Pencil className="h-4 w-4" /> Edit Profile
          </>
        )}
      </button>

      <button
        onClick={() => setDelOpen(true)}
        className="w-full h-12 rounded-xl border border-destructive text-destructive font-semibold hover:bg-destructive/10 inline-flex items-center justify-center gap-2"
      >
        <Trash2 className="h-4 w-4" /> Delete Profile
      </button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <EditFields role={role} form={form} setForm={setForm} />
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditOpen(false)}
              className="h-11 px-4 rounded-lg border border-border font-medium"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="h-11 px-4 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your profile and data from Necto.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditFields({
  role,
  form,
  setForm,
}: {
  role: Role;
  form: any;
  setForm: (f: any) => void;
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  if (role === "customer") {
    return (
      <>
        <Field label="Full Name" value={form?.name ?? ""} onChange={set("name")} />
        <Field label="Area / City" value={form?.area ?? ""} onChange={set("area")} />
        <Field label="Phone" inputMode="tel" value={form?.phone ?? ""} onChange={set("phone")} />
      </>
    );
  }
  if (role === "worker") {
    return (
      <>
        <Field label="Name" value={form?.name ?? ""} onChange={set("name")} />
        <Field label="Job Type" value={form?.job_type ?? ""} onChange={set("job_type")} />
        <Field
          label="Experience (years)"
          type="number"
          value={form?.experience ?? 0}
          onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })}
        />
        <Field label="Phone" inputMode="tel" value={form?.phone ?? ""} onChange={set("phone")} />
        <Field label="WhatsApp" inputMode="tel" value={form?.whatsapp ?? ""} onChange={set("whatsapp")} />
        <Field label="Area" value={form?.area ?? ""} onChange={set("area")} />
        <Field label="Photo URL" value={form?.photo_url ?? ""} onChange={set("photo_url")} />
        <TextArea label="Description" value={form?.description ?? ""} onChange={set("description")} />
      </>
    );
  }
  return (
    <>
      <Field label="Shop Name" value={form?.shop_name ?? ""} onChange={set("shop_name")} />
      <Field label="Owner Name" value={form?.owner_name ?? ""} onChange={set("owner_name")} />
      <Field label="Category" value={form?.category ?? ""} onChange={set("category")} />
      <Field label="Phone" inputMode="tel" value={form?.phone ?? ""} onChange={set("phone")} />
      <Field label="WhatsApp" inputMode="tel" value={form?.whatsapp ?? ""} onChange={set("whatsapp")} />
      <Field label="Area" value={form?.area ?? ""} onChange={set("area")} />
      <Field label="Photo URL" value={form?.photo_url ?? ""} onChange={set("photo_url")} />
      <TextArea label="Description" value={form?.description ?? ""} onChange={set("description")} />
    </>
  );
}

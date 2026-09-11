import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface DuplicateNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber?: string;
  roleLabel?: "customer" | "worker" | "shop";
}

export function DuplicateNumberDialog({
  open,
  onOpenChange,
  phoneNumber,
  roleLabel,
}: DuplicateNumberDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl p-6 text-center sm:text-left">
        <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
            <AlertCircle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-lg font-bold text-foreground">
            Number Already Registered
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
            This number is already registered
            {phoneNumber ? ` (${phoneNumber})` : ""}.
            {roleLabel ? ` A ${roleLabel} account already exists with this phone number.` : ""}
            {" Please use a different phone number or sign in to your existing account."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

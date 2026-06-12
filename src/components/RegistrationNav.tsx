import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { clearAccount } from "@/lib/role";

export function goToAccountTypeSelection() {
  clearAccount();
  window.location.assign("/");
}

export function ChooseDifferentAccountTypeLink() {
  return (
    <button
      type="button"
      onClick={goToAccountTypeSelection}
      className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4"
    >
      Choose Different Account Type
    </button>
  );
}

export default function RegistrationNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={goToAccountTypeSelection}
          className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Back to account type selection"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <Link to="/" onClick={clearAccount} className="flex items-center gap-2 text-primary" aria-label="Necto home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">N</span>
          <span className="text-base font-bold tracking-tight">Necto</span>
        </Link>
      </div>
    </header>
  );
}

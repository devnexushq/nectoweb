import { Link } from "react-router-dom";
import { FileText, Shield, Info, ChevronRight } from "lucide-react";

const items = [
  { to: "/terms-and-conditions", label: "Terms & Conditions", Icon: FileText },
  { to: "/privacy-policy", label: "Privacy Policy", Icon: Shield },
  { to: "/", label: "About Necto", Icon: Info },
];

export function LegalInfoSection() {
  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Legal & Info
      </h3>
      <div className="rounded-2xl bg-white border border-border overflow-hidden">
        {items.map(({ to, label, Icon }, i) => (
          <Link
            key={to + i}
            to={to}
            className={`flex items-center gap-3 h-12 px-4 hover:bg-muted/50 transition-colors ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <Icon className="h-4 w-4 text-[#1E3A8A]" />
            <span className="flex-1 text-sm font-medium">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

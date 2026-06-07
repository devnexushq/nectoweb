import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  children: ReactNode;
};

export function LegalLayout({ title, lastUpdated, intro, children }: Props) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted/60 -ml-2"
        >
          <ArrowLeft className="h-5 w-5 text-[#1E3A8A]" />
        </button>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[#1E3A8A] leading-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{lastUpdated}</p>
        {intro ? <div className="mt-3 text-sm text-muted-foreground">{intro}</div> : null}

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="pt-5 border-t border-border first:border-0 first:pt-0">
      <h2 className="text-base sm:text-lg font-bold text-[#1E3A8A] uppercase tracking-wide">
        {number}. {title}
      </h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

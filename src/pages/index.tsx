import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Store, User, Users } from "lucide-react";
import { clearAccount, getRole, getUserId, homePathFor, registerPathFor, setRole, type Role } from "@/lib/role";
import { accountExists } from "@/hooks/useRoleGuard";
import { useSeo } from "@/lib/seo";
import { InstallButton } from "@/components/InstallButton";
import { InstallBanner } from "@/components/InstallBanner";



export default function Landing() {
  const navigate = useNavigate();
  useSeo({
    title: "NECTO — Discover Local, Buy Local",
    description: "NECTO is a hyperlocal marketplace to discover trusted local workers and shops near you.",
    canonical: "/",
  });

  useEffect(() => {
    let cancelled = false;

    const redirectSavedAccount = async () => {
      const role = getRole();
      if (!role) return;

      const id = getUserId();
      if (!id) {
        navigate(registerPathFor(role), { replace: true });
        return;
      }

      const exists = await accountExists(role, id);
      if (cancelled) return;
      if (exists === false) {
        clearAccount();
        return;
      }
      navigate(homePathFor(role), { replace: true });
    };

    redirectSavedAccount();
    return () => { cancelled = true; };
  }, [navigate]);

  function pick(role: Role) {
    setRole(role);
    navigate(registerPathFor(role) );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl font-extrabold text-white">N</span>
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">NECTO</h1>
          <p className="mt-2 text-base text-muted-foreground">Discover Local, Buy Local</p>
        </div>

        <div className="w-full space-y-3">
          <RoleButton icon={User} label="I'm a Customer" sub="Find workers & shops near you" onClick={() => pick("customer")} />
          <RoleButton icon={Users} label="I'm a Worker" sub="Get discovered by local customers" onClick={() => pick("worker")} />
          <RoleButton icon={Store} label="I have a Shop" sub="List your shop & products" onClick={() => pick("shop")} />
        </div>

        <div className="mt-6 w-full">
          <InstallButton className="w-full h-12 rounded-xl" size="lg" />
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Choose one — your role is locked after selection.
        </p>
      </div>
      <InstallBanner />
    </div>
  );
}

function RoleButton({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full p-5 rounded-2xl bg-white border-2 border-border hover:border-primary hover:shadow-md transition-all flex items-center gap-4 text-left"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary flex items-center justify-center transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-base text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <span className="text-accent text-xl">→</span>
    </button>
  );
}

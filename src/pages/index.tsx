import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Store, User, Users } from "lucide-react";
import { clearAccount, getRole, getUserId, homePathFor, registerPathFor, setRole, type Role } from "@/lib/role";
import { accountExists } from "@/hooks/useRoleGuard";
import { useSeo } from "@/lib/seo";
import { InstallButton } from "@/components/InstallButton";
import { InstallBanner } from "@/components/InstallBanner";



export default function Landing() {
  const navigate = useNavigate();
  const [checkingSavedAccount, setCheckingSavedAccount] = useState(() => Boolean(getRole()));
  useSeo({
    title: "NECTO | Discover Trusted Local Workers & Shops Near You",
    description: "NECTO is a trusted hyperlocal marketplace for discovering nearby workers, local shops, services, products, phone contacts, and WhatsApp-ready businesses in India.",
    canonical: "/",
  });

  useEffect(() => {
    let cancelled = false;

    const redirectSavedAccount = async () => {
      const role = getRole();
      if (!role) {
        setCheckingSavedAccount(false);
        return;
      }

      const id = getUserId();
      if (!id) {
        navigate(registerPathFor(role), { replace: true });
        return;
      }

      const exists = await accountExists(role, id);
      if (cancelled) return;
      if (exists === false) {
        clearAccount();
        setCheckingSavedAccount(false);
        return;
      }
      navigate(homePathFor(role), { replace: true });
    };

    redirectSavedAccount();
    return () => { cancelled = true; };
  }, [navigate]);

  function pick(role: Role) {
    setRole(role);
    navigate(registerPathFor(role));
  }

  if (checkingSavedAccount) return <NectoBootSplash />;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center">
          <div className="text-center mb-10">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl font-extrabold text-white">N</span>
            </div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">NECTO</h1>
            <p className="mt-2 text-base text-muted-foreground">Discover Local, Buy Local</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Find trusted workers, nearby shops, useful services, products, call contacts, and WhatsApp-ready local businesses in one simple marketplace.
            </p>
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
            Choose one. Your role is locked after selection.
          </p>
        </div>

        <section className="mx-auto mt-12 max-w-3xl space-y-5 text-left">
          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <h2 className="text-xl font-bold text-primary">A local discovery app built for real neighborhoods</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              NECTO helps people discover reliable local workers and shops without confusion. Customers can browse public profiles, compare categories, and contact businesses directly by call or WhatsApp. Workers and shop owners can create a public presence and get discovered by people nearby.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard title="For Customers" text="Find local workers, shops, services, and products from one clean app." />
            <InfoCard title="For Workers" text="Create a public worker profile and get discovered by nearby customers." />
            <InfoCard title="For Shops" text="List your shop and products so local buyers can contact you faster." />
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-primary">Popular local discovery on Necto</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              People use NECTO to search for electricians, plumbers, tutors, repair workers, service providers, general shops, product sellers, and other trusted local contacts. The platform is designed for simple onboarding, safe public profiles, and quick communication.
            </p>
          </div>
        </section>
      </main>
      <InstallBanner />
    </div>
  );
}

function NectoBootSplash() {
  return (
    <div className="min-h-screen grid place-items-center bg-white px-6">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary shadow-lg">
          <span className="text-3xl font-extrabold text-white">N</span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-primary">NECTO</h1>
        <p className="mt-2 text-sm text-muted-foreground">Opening your account...</p>
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
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

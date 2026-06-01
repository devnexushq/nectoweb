import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { isStandalone } from "@/lib/pwa";
import { InstallInstructionsDialog } from "./InstallInstructionsDialog";

export function InstallButton({
  variant = "default",
  size = "default",
  className,
  label = "Install Necto App",
}: {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}) {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  if (installed || isStandalone()) return null;

  async function handleClick() {
    const result = await promptInstall();
    if (result === "unavailable") setShowInstructions(true);
  }

  return (
    <>
      <Button onClick={handleClick} variant={variant} size={size} className={className}>
        <Download className="h-4 w-4" />
        {label}
      </Button>
      <InstallInstructionsDialog open={showInstructions} onOpenChange={setShowInstructions} />
    </>
  );
}

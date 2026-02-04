 "use client";

 "use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { profiles, generateProfileAnswers, type ProfileType } from "@/lib/testProfiles";

export const DevBanner = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser) return;

    setEnabled(true);
    setIsDev(!window.location.hostname.includes("qualcarreira.com"));
  }, []);

  const handleProfileTest = (profileType: ProfileType) => {
    const profileAnswers = generateProfileAnswers(profileType);
    sessionStorage.setItem("testAnswers", JSON.stringify(profileAnswers));
    router.push("/formulario-dados");
  };

  const handleRandomTest = () => {
    const randomAnswers: Record<number, number> = {};
    for (let i = 1; i <= 60; i++) {
      randomAnswers[i] = Math.floor(Math.random() * 5) + 1;
    }
    sessionStorage.setItem("testAnswers", JSON.stringify(randomAnswers));
    router.push("/formulario-dados");
  };

  const isOnAssessmentPage =
    pathname === "/avaliacao" || pathname?.startsWith("/avaliacao/");

  const hidden = !enabled || !isDev;

  return (
    <div
      className="bg-yellow-500 text-black px-4 py-2 text-center font-medium flex items-center justify-center gap-2 relative"
      style={hidden ? { display: "none" } : undefined}
    >
      <AlertTriangle className="w-4 h-4" />
      <span>AMBIENTE DE DESENVOLVIMENTO</span>
      <AlertTriangle className="w-4 h-4" />

      {isOnAssessmentPage && (
        <div className="absolute right-4 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="flex items-center gap-2"
              >
                🎯 Perfis de Teste
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Selecione um perfil</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.entries(profiles) as [
                ProfileType,
                (typeof profiles)[ProfileType]
              ][]).map(([key, profile]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleProfileTest(key)}
                  className="cursor-pointer flex flex-col items-start py-3"
                >
                  <span className="font-semibold">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.description}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRandomTest}
                className="cursor-pointer"
              >
                🎲 Aleatório (não recomendado)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

"use client";

import Link from "next/link";
import { ScanQrCode, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

interface SharedNavbarProps {
  variant?: "default" | "studio";
}

export function SharedNavbar({ variant = "default" }: SharedNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <ScanQrCode className="h-6 w-6" />
          <span>Live Listing</span>
        </Link>

        <div className="flex items-center gap-4">
          {variant === "default" && (
            <Link href="/studio">
              <Button variant="outline" className="gap-2">
                <Wand2 className="h-5 w-5" />
                Start Creating
              </Button>
            </Link>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

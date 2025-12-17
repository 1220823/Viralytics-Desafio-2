"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, HelpCircle } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground leading-tight">
              Ad-Bidder
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">
              Budget Optimization Engine
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Campaign
          </Link>
          <Link
            href="/results"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/results"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Results
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

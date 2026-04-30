"use client";

import { Scale, Languages } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export const Navbar = () => {
  const { lang, setLang, T } = useApp();
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname === "/") return null;
    const parts = pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  const pageName = getPageName();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <img src="/favicon.png" alt="Arbitrix" className="h-9 w-9 rounded-lg shadow-soft object-contain bg-white p-1" />
            <span>Arbitrix</span>
          </Link>
          {pageName && (
            <div className="flex items-center gap-2 animate-fade-in-up">
              <span className="text-muted-foreground/40 font-light">/</span>
              <span className="text-sm font-medium text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                {pageName}
              </span>
            </div>
          )}
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link 
            href="/" 
            className={`transition-smooth px-1 py-1 rounded-md ${pathname === "/" ? "text-primary font-bold bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
          >
            {T.nav.home}
          </Link>
          <Link 
            href="/features" 
            className={`transition-smooth px-1 py-1 rounded-md ${pathname === "/features" ? "text-primary font-bold bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
          >
            {T.nav.features}
          </Link>
          <Link 
            href="/analyze" 
            className={`transition-smooth px-1 py-1 rounded-md ${pathname === "/analyze" ? "text-primary font-bold bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
          >
            {T.nav.analyze}
          </Link>
        </nav>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-soft">
          <Languages className="h-4 w-4 text-muted-foreground ms-2" />
          <Button
            size="sm"
            variant={lang === "en" ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setLang("en")}
          >EN</Button>
          <Button
            size="sm"
            variant={lang === "ur" ? "default" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setLang("ur")}
          >اردو</Button>
        </div>
      </div>
    </header>
  );
};

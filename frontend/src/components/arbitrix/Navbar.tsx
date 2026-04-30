"use client";

import { Scale, Languages, Menu } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const navLinks = [
    { href: "/", label: T.nav.home },
    { href: "/features", label: T.nav.features },
    { href: "/analyze", label: T.nav.analyze },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border">
                    <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                      <img src="/favicon.png" alt="Arbitrix" className="h-8 w-8 rounded-lg shadow-soft object-contain bg-white p-1" />
                      <span>Arbitrix</span>
                    </Link>
                  </div>
                  <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                          pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="p-6 border-t border-border mt-auto">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Language</p>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-soft">
                      <Button
                        size="sm"
                        variant={lang === "en" ? "default" : "ghost"}
                        className="flex-1 h-8 rounded-lg text-xs"
                        onClick={() => setLang("en")}
                      >EN</Button>
                      <Button
                        size="sm"
                        variant={lang === "ur" ? "default" : "ghost"}
                        className="flex-1 h-8 rounded-lg text-xs font-urdu"
                        onClick={() => setLang("ur")}
                      >اردو</Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <img src="/favicon.png" alt="Arbitrix" className="h-9 w-9 rounded-lg shadow-soft object-contain bg-white p-1" />
            <span className="hidden sm:inline">Arbitrix</span>
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-smooth px-1 py-1 rounded-md ${
                pathname === link.href ? "text-primary font-bold bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-soft">
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

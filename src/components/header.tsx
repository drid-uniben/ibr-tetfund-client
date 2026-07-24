"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Public masthead. The right-hand nav is context-aware: it never offers the
 * page you're already on, and it surfaces the *other* funding track so an
 * applicant can cross over (staff <-> master's) in one click.
 */
const NAV = {
  home: { href: "/", label: "Home", short: "Home" },
  tetfund: { href: "/tet-fund", label: "TETFund IBR (Staff)", short: "Staff" },
  masters: { href: "/masters-funding", label: "Master's Funding", short: "Master's" },
};

export default function Header() {
  const pathname = usePathname();
  const [logoOk, setLogoOk] = useState(true);

  // Show Home everywhere except the home page; always show the funding track
  // the visitor is NOT currently on.
  const links = [
    pathname !== "/" && NAV.home,
    pathname !== "/tet-fund" && NAV.tetfund,
    pathname !== "/masters-funding" && NAV.masters,
  ].filter(Boolean) as { href: string; label: string; short: string }[];

  return (
    <header className="border-b border-[#ecdfec] bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" aria-label="DRID, University of Benin — home" className="shrink-0">
          {logoOk ? (
            <Image
              src="/logo-header.png"
              alt="Directorate of Research, Innovation and Development"
              width={853}
              height={293}
              priority
              className="h-14 w-auto sm:h-16"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6d035c] text-lg font-bold text-white">
                D
              </span>
              <span className="text-lg font-semibold text-[#4a0340]">DRID</span>
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 font-medium text-[#5b4557] transition-colors hover:bg-[#f3e8f2] hover:text-[#6d035c]"
            >
              <span className="sm:hidden">{link.short}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

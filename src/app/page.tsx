import Link from "next/link";
import Header from "@/components/header";
import { ArrowRight, GraduationCap, FlaskConical } from "lucide-react";

export const metadata = {
  title: "Research Funding — DRID, University of Benin",
  description:
    "Apply for research funding opportunities at the University of Benin, administered by the Directorate of Research, Innovation and Development.",
};

const opportunities = [
  {
    href: "/tet-fund",
    eyebrow: "TETFund Intervention",
    title: "Institution-Based Research Grant",
    body: "For academic staff. Submit a concept note for the TETFund IBR grant — the University's flagship internal research fund.",
    cta: "Start a staff application",
    Icon: FlaskConical,
  },
  {
    href: "/masters-funding",
    eyebrow: "Postgraduate Support",
    title: "Master's Research Grant",
    body: "For master's candidates. Apply for funding support toward your research project and its completion.",
    cta: "Start a master's application",
    Icon: GraduationCap,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf7fc] text-[#2b1229] flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#37012f] via-[#4a0340] to-[#6d035c] text-white">
          {/* soft gold glow, top-right */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e8b923]/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0cf6b]">
                University of Benin · DRID
              </p>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Let&apos;s fund your research.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#ecd8ea]">
                Two open opportunities, one short form each. Choose the track
                that fits you and we&apos;ll walk you through it — no account
                needed, and your progress saves as you type.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/tet-fund"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#6d035c] transition-colors hover:bg-[#f6ecc9]"
                >
                  Staff — TETFund IBR
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/masters-funding"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Master&apos;s Research
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          {/* gold hairline */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#e8b923]/50 to-transparent" />
        </section>

        {/* Opportunities */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-5 sm:grid-cols-2">
            {opportunities.map(({ href, eyebrow, title, body, cta, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group relative flex flex-col rounded-2xl border border-[#e6d9e6] bg-white/70 p-7 transition-all hover:border-[#6d035c] hover:bg-white hover:shadow-[0_12px_40px_-24px_rgba(109,3,92,0.55)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e8f2] text-[#6d035c] transition-colors group-hover:bg-[#6d035c] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6f00]">
                  {eyebrow}
                </p>
                <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight text-[#4a0340]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#5b4557]">
                  {body}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d035c]">
                  {cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-[#6b5567]">
            Applications are reviewed by the Directorate of Research, Innovation
            and Development. Deadlines are shown on each application form.
          </p>
        </section>
      </main>

      <footer className="border-t border-[#ecdfec]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-[#6b5567]">
            © {new Date().getFullYear()} DRID, University of Benin.
          </p>
          <p className="mt-1 text-xs text-[#8a7285]">
            Need help? Email{" "}
            <Link
              href="mailto:drid@uniben.edu"
              className="font-medium text-[#6d035c] underline decoration-[#d9b8d3] underline-offset-2 hover:decoration-[#6d035c]"
              title="send email"
            >
              drid@uniben.edu
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

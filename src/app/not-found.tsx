import Link from "next/link";
import Header from "@/components/header";
import { ArrowRight, Home, Compass } from "lucide-react";

export const metadata = {
  title: "Page Not Found — DRID UNIBEN",
  description:
    "The page you are looking for could not be found. Explore the available research funding opportunities at the University of Benin.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16 flex items-center">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Numeral */}
          <p className="text-[6rem] sm:text-[8rem] font-bold leading-none tracking-tight text-purple-800">
            404
            <span className="text-c-gold">.</span>
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            The link may be broken, or the page may have moved. Let&apos;s get
            you back to a research funding opportunity at the University of
            Benin.
          </p>

          {/* Context-aware routes */}
          <div className="mt-12 grid sm:grid-cols-2 gap-6 text-left">
            <Link
              href="/tet-fund"
              className="group bg-white rounded-lg shadow-lg overflow-hidden p-6 transition-shadow hover:shadow-xl border border-transparent hover:border-purple-200"
            >
              <h2 className="text-lg font-semibold text-purple-800">
                TETFund IBR Grant
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Apply for the TETFund Institution Based Research grant.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-purple-800 group-hover:text-purple-900">
                Apply now
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              href="/masters-funding"
              className="group bg-white rounded-lg shadow-lg overflow-hidden p-6 transition-shadow hover:shadow-xl border border-transparent hover:border-purple-200"
            >
              <h2 className="text-lg font-semibold text-purple-800">
                Master&apos;s Research Grant
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Apply for funding support for your master&apos;s research
                project.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-purple-800 group-hover:text-purple-900">
                Apply now
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          {/* Primary action */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white bg-purple-800 hover:bg-purple-900 transition-colors duration-200"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to home
            </Link>
            <a
              href="https://drid.uniben.edu"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-purple-800 bg-white border border-purple-200 hover:border-purple-800 transition-colors duration-200"
            >
              <Compass className="mr-2 h-5 w-5" />
              Visit DRID
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} DRID UNIBEN. All rights reserved.
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            For technical support, please contact:{" "}
            <Link
              href="mailto:drid@uniben.edu"
              className="text-blue-500"
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
"use client"
import Link from 'next/link';
import Header from '@/components/header';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Research Funding Opportunities
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Select from available funding opportunities at the University of Benin
          </p>

          {/* CTAs */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* TETFund Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                  TETFund IBR Grant
                </h2>
                <p className="text-gray-600 mb-6">
                  Apply for the TETFund Institution Based Research (IBR) grant funding opportunity at the University of Benin.
                </p>
                <Link
                  href="/tet-fund"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-800 hover:bg-purple-900 transition-colors duration-200"
                >
                  Apply for TETFund IBR Grant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Masters Funding Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                  Masters Research Grant
                </h2>
                <p className="text-gray-600 mb-6">
                  Apply for funding support for your masters research project at the University of Benin.
                </p>
                <Link 
                  href="/masters-funding"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-800 hover:bg-purple-900 transition-colors duration-200"
                >
                  Apply for Masters Grant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} DRID UNIBEN. All rights reserved.
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            For technical support, please contact:{' '}
            <Link href="mailto:drid@uniben.edu" className="text-blue-500" title="send email">
              drid@uniben.edu
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Blockchain Certificate
              <span className="block text-blue-200">Verification</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Secure, transparent, and tamper-proof certificate verification
              powered by blockchain technology and IPFS storage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verify">
                <Button size="large" className="px-8 py-4 text-lg">
                  Verify Certificate
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  variant="secondary"
                  size="large"
                  className="px-8 py-4 text-lg"
                >
                  Admin Portal
                </Button>
              </Link>
              <Link href="/transfer">
                <Button
                  variant="secondary"
                  size="large"
                  className="px-8 py-4 text-lg"
                >
                  Transfer Calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CertifyDApp?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform ensures the highest level of security and
              transparency for academic certificate verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Blockchain Security
              </h3>
              <p className="text-gray-600">
                All certificates are stored on blockchain with cryptographic
                hashes, ensuring immutability and preventing fraud.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Verification
              </h3>
              <p className="text-gray-600">
                Verify any certificate in seconds using just the certificate
                hash. No need for lengthy verification processes.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                IPFS Storage
              </h3>
              <p className="text-gray-600">
                Original certificate PDFs are stored on IPFS, providing
                decentralized and permanent access to documents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple and secure process for both issuing and verifying
              certificates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Universities */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                For Universities
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Admin Login</h4>
                    <p className="text-gray-600">
                      Authenticate using university credentials or wallet
                      connection.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Issue Certificate
                    </h4>
                    <p className="text-gray-600">
                      Fill student details and upload the PDF certificate.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Blockchain Storage
                    </h4>
                    <p className="text-gray-600">
                      System automatically stores certificate hash on blockchain
                      and PDF on IPFS.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Verifiers */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                For Verifiers
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Enter Certificate Hash
                    </h4>
                    <p className="text-gray-600">
                      Input the certificate hash provided by the student or
                      university.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Instant Verification
                    </h4>
                    <p className="text-gray-600">
                      System checks blockchain and validates digital signatures.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      View Results
                    </h4>
                    <p className="text-gray-600">
                      Get verification results with certificate details and
                      access to original PDF.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the future of certificate verification with blockchain
            technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/verify">
              <Button variant="secondary" size="large" className="px-8 py-4">
                Verify a Certificate
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant="secondary"
                size="large"
                className="px-8 py-4 !bg-white !text-gray-700 hover:!bg-gray-100 hover:!text-black border border-gray-300"
              >
                University Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

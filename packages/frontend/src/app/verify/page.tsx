'use client'

import { useState } from 'react'
import { Button, Input, Alert } from '@/components/ui'
import config from '@/lib/config'

interface VerificationResult {
  isValid: boolean
  certificateData?: {
    studentName: string
    courseName: string
    issuerName: string
    issueDate: string
    ipfsHash: string
    blockchainHash: string
  }
  error?: string
}

export default function VerifyPage() {
  const [certificateHash, setCertificateHash] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async () => {
    if (!certificateHash.trim()) {
      setResult({ isValid: false, error: 'Please enter a certificate hash' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Call the verification API
      const response = await fetch(`${config.API_BASE_URL}/api/certificates/verify/${certificateHash}`)
      const data = await response.json()

      if (response.ok) {
        setResult({
          isValid: data.isValid,
          certificateData: data.certificate
        })
      } else {
        setResult({
          isValid: false,
          error: data.error || 'Verification failed'
        })
      }
    } catch {
      setResult({
        isValid: false,
        error: 'Network error. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPDF = (ipfsHash: string) => {
    // Open IPFS PDF in new tab
    window.open(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verify Certificate
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter the certificate hash to verify its authenticity on the blockchain.
            You can find this hash on your certificate document or from the issuing university.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="hash" className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Hash
              </label>
              <Input
                id="hash"
                type="text"
                placeholder="Enter certificate hash (e.g., 0x123abc...)"
                value={certificateHash}
                onChange={(e) => setCertificateHash(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-2">
                The certificate hash is a unique identifier that starts with &quot;0x&quot; followed by alphanumeric characters.
              </p>
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3"
            >
              {isLoading ? 'Verifying...' : 'Verify Certificate'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {result.isValid ? (
              <div>
                <Alert 
                  type="success" 
                  className="mb-6"
                  title="Certificate Verified!"
                  message="This certificate is authentic and has been verified on the blockchain."
                />

                {result.certificateData && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      Certificate Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Student Name</label>
                          <p className="text-lg font-semibold text-gray-900">{result.certificateData.studentName}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Course/Program</label>
                          <p className="text-lg font-semibold text-gray-900">{result.certificateData.courseName}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Issuing Institution</label>
                          <p className="text-lg font-semibold text-gray-900">{result.certificateData.issuerName}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Issue Date</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(result.certificateData.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Blockchain Hash</label>
                          <p className="text-sm font-mono text-gray-700 break-all bg-gray-50 p-2 rounded">
                            {result.certificateData.blockchainHash}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">IPFS Hash</label>
                          <p className="text-sm font-mono text-gray-700 break-all bg-gray-50 p-2 rounded">
                            {result.certificateData.ipfsHash}
                          </p>
                        </div>

                        <Button
                          onClick={() => handleViewPDF(result.certificateData!.ipfsHash)}
                          variant="secondary"
                          className="w-full"
                        >
                          View Original Certificate PDF
                        </Button>
                      </div>
                    </div>

                    {/* Verification Badges */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✓ Blockchain Verified
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          ✓ IPFS Stored
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          ✓ Digitally Signed
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          ✓ Tamper Proof
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert 
                type="error"
                title="Verification Failed!"
                message={result.error || 'This certificate could not be verified. It may be invalid or not exist on the blockchain.'}
              />
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Need Help?
          </h2>
          <div className="prose text-gray-600">
            <p className="mb-4">
              <strong>Where to find your certificate hash:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Look for a QR code or text beginning with &quot;0x&quot; on your certificate</li>
              <li>Check the email you received when the certificate was issued</li>
              <li>Contact your university&apos;s registrar office</li>
              <li>Log into your student portal if available</li>
            </ul>
            <p className="text-sm">
              <strong>Note:</strong> Certificate verification is instant and free. 
              The hash is a unique cryptographic fingerprint that cannot be forged or duplicated.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

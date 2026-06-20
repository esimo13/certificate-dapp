"use client";

import { useState } from "react";
import { Button, Input, Alert } from "@/components/ui";

interface CertificateData {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCode: string;
  completionDate: string;
  grade: string;
  degreeType: string;
  university: string;
}

interface IssuanceResult {
  success: boolean;
  certificateHash?: string;
  ipfsHash?: string;
  error?: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [certificateForm, setCertificateForm] = useState<CertificateData>({
    studentName: "",
    studentEmail: "",
    courseName: "",
    courseCode: "",
    completionDate: "",
    grade: "",
    degreeType: "",
    university: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IssuanceResult | null>(null);

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginForm),
        }
      );

      if (response.ok) {
        setIsLoggedIn(true);
        setResult(null);
      } else {
        const data = await response.json();
        setResult({ success: false, error: data.error || "Login failed" });
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedFile) {
      setResult({ success: false, error: "Please select a PDF certificate" });
      return;
    }

    // Validate form
    const requiredFields = [
      "studentName",
      "studentEmail",
      "courseName",
      "courseCode",
      "completionDate",
      "grade",
      "degreeType",
      "university",
    ];
    for (const field of requiredFields) {
      if (!certificateForm[field as keyof CertificateData]) {
        setResult({
          success: false,
          error: `Please fill in ${field
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}`,
        });
        return;
      }
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("certificate", selectedFile);
      formData.append("studentName", certificateForm.studentName);
      formData.append("studentEmail", certificateForm.studentEmail);
      formData.append("courseName", certificateForm.courseName);
      formData.append("courseCode", certificateForm.courseCode);
      formData.append("completionDate", certificateForm.completionDate);
      formData.append("grade", certificateForm.grade);
      formData.append("degreeType", certificateForm.degreeType);
      formData.append("university", certificateForm.university);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/certificates/issue`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          certificateHash: data.certificateHash,
          ipfsHash: data.ipfsHash,
        });
        // Reset form
        setCertificateForm({
          studentName: "",
          studentEmail: "",
          courseName: "",
          courseCode: "",
          completionDate: "",
          grade: "",
          degreeType: "",
          university: "",
        });
        setSelectedFile(null);
      } else {
        setResult({
          success: false,
          error: data.error || "Certificate issuance failed",
        });
      }
    } catch {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ email: "", password: "" });
    setResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              University Admin Portal
            </h1>
            <p className="text-gray-600">
              Sign in to issue blockchain certificates
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                placeholder="admin@university.edu"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                placeholder="Enter your password"
                className="w-full"
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            {result && !result.success && (
              <Alert
                type="error"
                title="Login Failed"
                message={result.error || "Invalid credentials"}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Certificate Issuance Portal
              </h1>
              <p className="text-gray-600 mt-2">
                Issue blockchain-verified certificates for your students
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Certificate Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Issue New Certificate
            </h2>

            <div className="space-y-6">
              {/* Student Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name *
                    </label>
                    <Input
                      value={certificateForm.studentName}
                      onChange={(e) =>
                        setCertificateForm({
                          ...certificateForm,
                          studentName: e.target.value,
                        })
                      }
                      placeholder="Saif Mohammed Omer"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Email *
                    </label>
                    <Input
                      type="email"
                      value={certificateForm.studentEmail}
                      onChange={(e) =>
                        setCertificateForm({
                          ...certificateForm,
                          studentEmail: e.target.value,
                        })
                      }
                      placeholder="saif@email.com"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Course Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Name *
                    </label>
                    <Input
                      value={certificateForm.courseName}
                      onChange={(e) =>
                        setCertificateForm({
                          ...certificateForm,
                          courseName: e.target.value,
                        })
                      }
                      placeholder="Information Technology"
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Code *
                      </label>
                      <Input
                        value={certificateForm.courseCode}
                        onChange={(e) =>
                          setCertificateForm({
                            ...certificateForm,
                            courseCode: e.target.value,
                          })
                        }
                        placeholder="ICT-4101"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree Type
                      </label>
                      <select
                        value={certificateForm.degreeType}
                        onChange={(e) =>
                          setCertificateForm({
                            ...certificateForm,
                            degreeType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          Choose Degree Type
                        </option>
                        <option value="Bachelor">Bachelor&apos;s Degree</option>
                        <option value="Master">Master&apos;s Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Diploma">Diploma</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University *
                      </label>
                      <select
                        value={certificateForm.university}
                        onChange={(e) =>
                          setCertificateForm({
                            ...certificateForm,
                            university: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          Choose University
                        </option>
                        <option value="Jahangirnagar University">
                          Jahangirnagar University
                        </option>
                        <option value="Dhaka University">
                          Dhaka University
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Completion Date *
                      </label>
                      <Input
                        type="date"
                        value={certificateForm.completionDate}
                        onChange={(e) =>
                          setCertificateForm({
                            ...certificateForm,
                            completionDate: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade/Result *
                      </label>
                      <Input
                        value={certificateForm.grade}
                        onChange={(e) =>
                          setCertificateForm({
                            ...certificateForm,
                            grade: e.target.value,
                          })
                        }
                        placeholder="4.00"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Certificate PDF *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleIssueCertificate}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Issuing Certificate..." : "Issue Certificate"}
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Issuance Results
            </h2>

            {result ? (
              result.success ? (
                <div className="space-y-6">
                  <Alert
                    type="success"
                    title="Certificate Issued Successfully!"
                    message="The certificate has been stored on blockchain and IPFS."
                  />

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Hash (Share with student)
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md font-mono text-sm break-all">
                          {result.certificateHash}
                        </div>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() =>
                            copyToClipboard(result.certificateHash!)
                          }
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IPFS Hash
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md font-mono text-sm break-all">
                          {result.ipfsHash}
                        </div>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => copyToClipboard(result.ipfsHash!)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Next Steps:
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Send the certificate hash to the student</li>
                        <li>
                          • Student can verify the certificate using the hash
                        </li>
                        <li>
                          • Certificate is permanently stored on blockchain
                        </li>
                        <li>• PDF is accessible via IPFS</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert
                  type="error"
                  title="Issuance Failed"
                  message={
                    result.error ||
                    "An error occurred while issuing the certificate."
                  }
                />
              )
            ) : (
              <div className="text-center text-gray-500 py-12">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Fill out the form and upload a PDF to issue a certificate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

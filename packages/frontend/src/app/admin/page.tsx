"use client";

import { useEffect, useState } from "react";
import { Button, Input, Alert } from "@/components/ui";
import config from "@/lib/config";

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

interface UniversityRecord {
  id: string;
  name: string;
  country: string;
  annual_load_units: number;
}

interface AdminSessionUser {
  id: string;
  email: string;
  university: string;
  role: string;
  universityRecord: UniversityRecord;
}

interface ManagedCourse {
  id: string;
  uni_id: string;
  course_code: string;
  title: string;
  credits: number;
  syllabus_text: string | null;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(null);
  const [universityRecord, setUniversityRecord] = useState<UniversityRecord | null>(null);
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
  const [managedCourses, setManagedCourses] = useState<ManagedCourse[]>([]);
  const [courseForm, setCourseForm] = useState({
    id: "",
    courseCode: "",
    title: "",
    credits: "3",
    syllabusText: "",
  });
  const [uniForm, setUniForm] = useState({ country: "", annualLoadUnits: "" });
  const [managementMessage, setManagementMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isManagementLoading, setIsManagementLoading] = useState(false);
  const [result, setResult] = useState<IssuanceResult | null>(null);

  const adminHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const loadUniversityContext = async (token: string) => {
    const [uniRes, coursesRes] = await Promise.all([
      fetch(`${config.API_BASE_URL}/api/admin/university`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${config.API_BASE_URL}/api/admin/university/courses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    if (!uniRes.ok) {
      const errorBody = await uniRes.json().catch(() => ({}));
      throw new Error(errorBody.error || "Failed to load university profile");
    }

    if (!coursesRes.ok) {
      const errorBody = await coursesRes.json().catch(() => ({}));
      throw new Error(errorBody.error || "Failed to load university courses");
    }

    const uniData = await uniRes.json();
    const coursesData = await coursesRes.json();

    setUniversityRecord(uniData.university);
    setUniForm({
      country: uniData.university.country || "",
      annualLoadUnits: String(uniData.university.annual_load_units || ""),
    });
    setManagedCourses(coursesData.courses || []);
    setCertificateForm((prev) => ({
      ...prev,
      university: uniData.university.name,
    }));
  };

  useEffect(() => {
    if (!isLoggedIn || !authToken) {
      return;
    }

    setIsManagementLoading(true);
    setManagementMessage("");
    loadUniversityContext(authToken)
      .catch((error) => {
        setManagementMessage(error instanceof Error ? error.message : "Failed to load university context");
      })
      .finally(() => setIsManagementLoading(false));
  }, [isLoggedIn, authToken]);

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginForm),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token || "");
        setAdminUser(data.user || null);
        setCertificateForm((prev) => ({
          ...prev,
          university: data.user?.university || "",
        }));
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
        `${config.API_BASE_URL}/api/certificates/issue`,
        {
          method: "POST",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
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
          university: adminUser?.university || "",
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

  const handleSaveUniversityProfile = async () => {
    if (!authToken) {
      return;
    }

    setIsManagementLoading(true);
    setManagementMessage("");

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/university`, {
        method: "PUT",
        headers: adminHeaders(authToken),
        body: JSON.stringify({
          country: uniForm.country,
          annualLoadUnits: Number(uniForm.annualLoadUnits),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update university profile");
      }

      setUniversityRecord(data.university);
      setManagementMessage("University profile updated successfully.");
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : "Failed to update university profile");
    } finally {
      setIsManagementLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!authToken) {
      return;
    }

    setIsManagementLoading(true);
    setManagementMessage("");

    try {
      const endpoint = courseForm.id
        ? `${config.API_BASE_URL}/api/admin/university/courses/${courseForm.id}`
        : `${config.API_BASE_URL}/api/admin/university/courses`;

      const method = courseForm.id ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: adminHeaders(authToken),
        body: JSON.stringify({
          courseCode: courseForm.courseCode,
          title: courseForm.title,
          credits: Number(courseForm.credits),
          syllabusText: courseForm.syllabusText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      const savedCourse = data.course as ManagedCourse;
      setManagedCourses((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === savedCourse.id);
        if (existingIndex === -1) {
          return [...prev, savedCourse].sort((a, b) => a.course_code.localeCompare(b.course_code));
        }

        const next = [...prev];
        next[existingIndex] = savedCourse;
        return next.sort((a, b) => a.course_code.localeCompare(b.course_code));
      });

      setCourseForm({
        id: "",
        courseCode: "",
        title: "",
        credits: "3",
        syllabusText: "",
      });
      setManagementMessage(`Course ${savedCourse.course_code} saved successfully.`);
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : "Failed to save course");
    } finally {
      setIsManagementLoading(false);
    }
  };

  const handleEditCourse = (course: ManagedCourse) => {
    setCourseForm({
      id: course.id,
      courseCode: course.course_code,
      title: course.title,
      credits: String(course.credits),
      syllabusText: course.syllabus_text || "",
    });
    setManagementMessage("");
  };

  const handleLogout = () => {
    if (authToken) {
      fetch(`${config.API_BASE_URL}/api/admin/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).catch(() => undefined);
    }

    setIsLoggedIn(false);
    setAuthToken("");
    setAdminUser(null);
    setUniversityRecord(null);
    setManagedCourses([]);
    setCourseForm({
      id: "",
      courseCode: "",
      title: "",
      credits: "3",
      syllabusText: "",
    });
    setUniForm({ country: "", annualLoadUnits: "" });
    setManagementMessage("");
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
              {adminUser && (
                <p className="text-sm text-gray-500 mt-1">
                  Signed in as {adminUser.email} ({adminUser.university})
                </p>
              )}
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            University Transfer Data Management
          </h2>

          {managementMessage && (
            <Alert
              type={managementMessage.toLowerCase().includes("failed") ? "error" : "success"}
              message={managementMessage}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">University Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                  <Input value={universityRecord?.name || adminUser?.university || ""} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <Input
                    value={uniForm.country}
                    onChange={(e) => setUniForm((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="Bangladesh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Annual Load Units</label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={uniForm.annualLoadUnits}
                    onChange={(e) =>
                      setUniForm((prev) => ({
                        ...prev,
                        annualLoadUnits: e.target.value,
                      }))
                    }
                    placeholder="36"
                  />
                </div>
                <Button onClick={handleSaveUniversityProfile} disabled={isManagementLoading}>
                  {isManagementLoading ? "Saving..." : "Save University Profile"}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {courseForm.id ? "Edit Course" : "Add New Course"}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                    <Input
                      value={courseForm.courseCode}
                      onChange={(e) =>
                        setCourseForm((prev) => ({ ...prev, courseCode: e.target.value.toUpperCase() }))
                      }
                      placeholder="CSE110"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, credits: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                  <Input
                    value={courseForm.title}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Programming I"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Syllabus Text</label>
                  <textarea
                    value={courseForm.syllabusText}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, syllabusText: e.target.value }))
                    }
                    placeholder="Intro to programming, variables, loops, functions, arrays."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveCourse} disabled={isManagementLoading}>
                    {isManagementLoading ? "Saving..." : courseForm.id ? "Update Course" : "Add Course"}
                  </Button>
                  {courseForm.id && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setCourseForm({
                          id: "",
                          courseCode: "",
                          title: "",
                          credits: "3",
                          syllabusText: "",
                        })
                      }
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your University Courses</h3>
            <div className="border rounded-md overflow-hidden">
              {managedCourses.length === 0 ? (
                <p className="p-4 text-gray-500">No courses yet. Add your first course above.</p>
              ) : (
                <div className="divide-y">
                  {managedCourses.map((course) => (
                    <div key={course.id} className="p-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {course.course_code} - {course.title}
                        </p>
                        <p className="text-sm text-gray-600">Credits: {course.credits}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {course.syllabus_text || "No syllabus text added yet."}
                        </p>
                      </div>
                      <Button variant="secondary" size="small" onClick={() => handleEditCourse(course)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                      <Input
                        value={certificateForm.university}
                        readOnly
                        className="w-full bg-gray-50"
                        placeholder="University is set from your admin account"
                      />
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

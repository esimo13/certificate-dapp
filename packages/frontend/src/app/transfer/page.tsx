'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, Button } from '@/components/ui'
import { apiClient } from '@/lib/api'

type University = {
  id: string
  name: string
  country: string
  annual_load_units: number
}

type Course = {
  id: string
  uni_id: string
  course_code: string
  title: string
  credits: number
  syllabus_text: string
}

type MappingResult = {
  sourceCourse: Course
  convertedUnits: number
  bestMatch: {
    equivalencyId: string
    matchConfidenceScore: number
    targetCourse: Course
  } | null
}

type TransferResult = {
  sourceUniversity: University
  targetUniversity: University
  estimatedTransferableUnits: number
  mappedCourses: MappingResult[]
  privacy: {
    eligibilityProofProvided: boolean
    note: string
  }
}

export default function TransferPage() {
  const [step, setStep] = useState(1)
  const [universities, setUniversities] = useState<University[]>([])
  const [sourceUniversityId, setSourceUniversityId] = useState('')
  const [targetUniversityId, setTargetUniversityId] = useState('')
  const [sourceCourses, setSourceCourses] = useState<Course[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null)
  const [syllabusComparison, setSyllabusComparison] = useState<Record<string, { match_percentage: number; reasoning: string }>>({})
  const [uploadedSyllabusFiles, setUploadedSyllabusFiles] = useState<
    Record<string, { sourceFile: File | null; targetFile: File | null }>
  >({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sourceUniversity = useMemo(
    () => universities.find((uni) => uni.id === sourceUniversityId) || null,
    [universities, sourceUniversityId]
  )

  useEffect(() => {
    const loadUniversities = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiClient.getUniversities()
        if (response.error) {
          setError(response.error)
          return
        }
        setUniversities(response.universities || [])
      } catch {
        setError('Failed to load universities')
      } finally {
        setLoading(false)
      }
    }

    loadUniversities()
  }, [])

  useEffect(() => {
    if (!sourceUniversityId) {
      setSourceCourses([])
      return
    }

    const loadCourses = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiClient.getCourses(sourceUniversityId)
        if (response.error) {
          setError(response.error)
          return
        }
        setSourceCourses(response.courses || [])
      } catch {
        setError('Failed to load source courses')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [sourceUniversityId])

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }

  const handleCalculateTransfer = async () => {
    if (!sourceUniversityId || !targetUniversityId || selectedCourseIds.length === 0) {
      setError('Please select both universities and at least one completed source course.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await apiClient.calculateTransfer({
        sourceUniversityId,
        targetUniversityId,
        sourceCourseIds: selectedCourseIds,
        eligibilityProof: 'placeholder-zkp-proof-token',
      })

      if (response.error) {
        setError(response.error)
        return
      }

      setTransferResult(response)
      setStep(3)
    } catch {
      setError('Failed to calculate transferable units')
    } finally {
      setLoading(false)
    }
  }

  const handleCompareSyllabus = async (mapping: MappingResult) => {
    if (!mapping.bestMatch?.targetCourse) return

    const key = mapping.sourceCourse.id
    const files = uploadedSyllabusFiles[key]

    if (!files?.sourceFile || !files?.targetFile) {
      setError('Please upload both source and target syllabus PDFs before running comparison.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiClient.compareSyllabusFromPdf(files.sourceFile, files.targetFile)

      if (response.error) {
        setError(response.error)
        return
      }

      setSyllabusComparison((prev) => ({
        ...prev,
        [key]: {
          match_percentage: response.match_percentage,
          reasoning: response.reasoning,
        },
      }))
    } catch {
      setError('Syllabus comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSyllabusFileChange = (
    sourceCourseId: string,
    fileType: 'sourceFile' | 'targetFile',
    file: File | null
  ) => {
    setUploadedSyllabusFiles((prev) => ({
      ...prev,
      [sourceCourseId]: {
        sourceFile: prev[sourceCourseId]?.sourceFile || null,
        targetFile: prev[sourceCourseId]?.targetFile || null,
        [fileType]: file,
      },
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Transfer Calculator</h1>
          <p className="text-gray-600 mb-8">
            Estimate transferable units and find the best matching target courses using equivalencies and syllabus AI.
          </p>

          <div className="flex items-center gap-3 mb-8">
            <span className={`px-3 py-1 rounded-full text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Step 1
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Step 2
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Step 3
            </span>
          </div>

          {error && <Alert type="error" message={error} />}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Source and Target University</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source University</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    value={sourceUniversityId}
                    onChange={(e) => setSourceUniversityId(e.target.value)}
                  >
                    <option value="">Select source university</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name} ({uni.country})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target University</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    value={targetUniversityId}
                    onChange={(e) => setTargetUniversityId(e.target.value)}
                  >
                    <option value="">Select target university</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name} ({uni.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!sourceUniversityId || !targetUniversityId || sourceUniversityId === targetUniversityId || loading}
                >
                  Continue to Course Selection
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Select Completed Source Courses</h2>
              <p className="text-gray-600 mb-4">
                Choose completed courses from {sourceUniversity?.name || 'source university'}.
              </p>

              <div className="border rounded-md max-h-96 overflow-auto">
                {sourceCourses.length === 0 ? (
                  <p className="p-4 text-gray-500">No courses found for selected source university.</p>
                ) : (
                  sourceCourses.map((course) => (
                    <label key={course.id} className="flex items-start gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => handleToggleCourse(course.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {course.course_code} - {course.title}
                        </p>
                        <p className="text-sm text-gray-600">Credits: {course.credits}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleCalculateTransfer} loading={loading} disabled={selectedCourseIds.length === 0}>
                  Calculate Transfer
                </Button>
              </div>
            </div>
          )}

          {step === 3 && transferResult && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Estimated Transfer Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-md p-4">
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="font-semibold text-gray-900">{transferResult.sourceUniversity.name}</p>
                </div>
                <div className="bg-indigo-50 rounded-md p-4">
                  <p className="text-sm text-gray-600">Target</p>
                  <p className="font-semibold text-gray-900">{transferResult.targetUniversity.name}</p>
                </div>
                <div className="bg-green-50 rounded-md p-4">
                  <p className="text-sm text-gray-600">Estimated Transferable Units</p>
                  <p className="font-bold text-2xl text-green-700">{transferResult.estimatedTransferableUnits}</p>
                </div>
              </div>

              <Alert type="info" message={transferResult.privacy.note} />

              <div className="space-y-4 mt-6">
                {transferResult.mappedCourses.map((mapping) => (
                  <div key={mapping.sourceCourse.id} className="border rounded-md p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {mapping.sourceCourse.course_code} - {mapping.sourceCourse.title}
                        </p>
                        <p className="text-sm text-gray-600">Converted units: {mapping.convertedUnits}</p>
                        {mapping.bestMatch?.targetCourse ? (
                          <p className="text-sm text-gray-700 mt-1">
                            Best match: {mapping.bestMatch.targetCourse.course_code} - {mapping.bestMatch.targetCourse.title}
                            {' '}({mapping.bestMatch.matchConfidenceScore}% confidence)
                          </p>
                        ) : (
                          <p className="text-sm text-amber-700 mt-1">No mapped target course found yet.</p>
                        )}
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => handleCompareSyllabus(mapping)}
                        disabled={!mapping.bestMatch?.targetCourse || loading}
                      >
                        Compare Uploaded PDFs
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Source syllabus PDF ({mapping.sourceCourse.course_code})
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            handleSyllabusFileChange(
                              mapping.sourceCourse.id,
                              'sourceFile',
                              e.target.files?.[0] || null
                            )
                          }
                          className="block w-full text-sm text-gray-700"
                        />
                        {uploadedSyllabusFiles[mapping.sourceCourse.id]?.sourceFile && (
                          <p className="text-xs text-gray-600 mt-1">
                            {uploadedSyllabusFiles[mapping.sourceCourse.id]?.sourceFile?.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target syllabus PDF ({mapping.bestMatch?.targetCourse?.course_code || 'N/A'})
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            handleSyllabusFileChange(
                              mapping.sourceCourse.id,
                              'targetFile',
                              e.target.files?.[0] || null
                            )
                          }
                          className="block w-full text-sm text-gray-700"
                          disabled={!mapping.bestMatch?.targetCourse}
                        />
                        {uploadedSyllabusFiles[mapping.sourceCourse.id]?.targetFile && (
                          <p className="text-xs text-gray-600 mt-1">
                            {uploadedSyllabusFiles[mapping.sourceCourse.id]?.targetFile?.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {syllabusComparison[mapping.sourceCourse.id] && (
                      <div className="mt-3 bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-900">
                          Match: {syllabusComparison[mapping.sourceCourse.id].match_percentage}%
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {syllabusComparison[mapping.sourceCourse.id].reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back to Course Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

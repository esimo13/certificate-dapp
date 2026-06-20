// API endpoints and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const apiClient = {
  // Health check
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.json()
  },

  // Admin authentication
  adminLogin: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  },

  // Issue certificate
  issueCertificate: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/certificates/issue`, {
      method: 'POST',
      body: formData,
    })
    return response.json()
  },

  // Verify certificate
  verifyCertificate: async (hash: string) => {
    const response = await fetch(`${API_BASE_URL}/certificates/verify/${hash}`)
    return response.json()
  },

  // Get all certificates
  getCertificates: async () => {
    const response = await fetch(`${API_BASE_URL}/certificates`)
    return response.json()
  },

  // Authorize issuer
  authorizeIssuer: async (issuerAddress: string, university: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/authorize-issuer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ issuerAddress, university }),
    })
    return response.json()
  },
}

// Utility functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const truncateAddress = (address: string, length = 6) => {
  if (!address) return ''
  return `${address.slice(0, length)}...${address.slice(-4)}`
}

export const createCertificateHash = (certificateData: {
  studentName: string
  studentId: string
  degree: string
  university: string
  issueDate: string
}) => {
  // This should match the backend hash generation
  const dataString = JSON.stringify(certificateData)
  // In a real application, you'd use a proper hash function
  // For now, we'll use a simple approach
  return btoa(dataString).slice(0, 32)
}

export const validatePDF = (file: File): boolean => {
  return file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024 // 5MB
}

export const downloadFromIPFS = (ipfsUrl: string) => {
  window.open(ipfsUrl, '_blank')
}

// Error handling
export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'APIError'
  }
}

// Certificate validation
export interface CertificateFormData {
  studentName: string
  studentId: string
  degree: string
  university: string
  issueDate?: string
  certificate?: File
}

export const validateCertificateForm = (data: CertificateFormData): string[] => {
  const errors: string[] = []

  if (!data.studentName.trim()) {
    errors.push('Student name is required')
  }

  if (!data.studentId.trim()) {
    errors.push('Student ID is required')
  }

  if (!data.degree.trim()) {
    errors.push('Degree is required')
  }

  if (!data.university.trim()) {
    errors.push('University is required')
  }

  if (data.certificate && !validatePDF(data.certificate)) {
    errors.push('Please upload a valid PDF file (max 5MB)')
  }

  return errors
}

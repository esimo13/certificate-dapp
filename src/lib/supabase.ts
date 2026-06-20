import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Certificate {
  id: string
  certificate_hash: string
  student_name: string
  student_id: string
  degree: string
  university: string
  issue_date: string
  ipfs_url: string
  ipfs_hash: string
  digital_signature: string
  public_key: string
  issuer_address: string
  created_at: string
  updated_at: string
}

export interface AuthorizedIssuer {
  id: string
  issuer_address: string
  university: string
  public_key?: string
  authorized_at: string
  is_active: boolean
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  university: string
  wallet_address?: string
  role: string
  is_active: boolean
  created_at: string
}

export interface VerificationAdditionalInfo {
  user_agent?: string
  referrer?: string
  location?: string
  verification_time_ms?: number
  blockchain_verified?: boolean
  ipfs_accessible?: boolean
  [key: string]: string | number | boolean | undefined
}

export interface VerificationLog {
  id: string
  certificate_hash: string
  verifier_ip?: string
  verification_result: boolean
  verification_method?: string
  verified_at: string
  additional_info?: VerificationAdditionalInfo
}

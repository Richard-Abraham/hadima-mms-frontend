export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: 'super_admin' | 'treasurer' | 'secretary' | 'chairperson' | 'member'
  status: string
  member_number: string | null
  approved_at: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

export interface Invoice {
  id: number
  user_id: number
  type: string
  reference: string
  amount: number
  status: string
  due_date: string
  paid_at: string | null
  notes: string | null
  created_at: string
}

export interface PaymentVerification {
  id: number
  invoice_id: number | null
  user_id: number
  channel: string
  transaction_code: string
  screenshot_path: string | null
  submitted_at: string
  verified_by: number | null
  verified_at: string | null
  status: string
  notes: string | null
}

export interface StatementEntry {
  date: string
  description: string
  reference: string
  debit: number
  credit: number
  balance: number
}

export interface Contribution {
  id: number
  title: string
  description: string | null
  type: string
  target_amount: number
  member_amount: number
  deadline: string
  status: string
  visibility: string
  created_by: number
  created_at: string
}

export interface Announcement {
  id: number
  title: string
  body: string
  is_urgent: boolean
  is_pinned: boolean
  published_at: string | null
  created_at: string
}

export interface CalendarEvent {
  id: number
  title: string
  start: string
  end?: string
  color?: string
  description?: string
}

// lib/types.ts

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role: "customer" | "salon"
}

export interface Salon {
  id: string
  name: string
  contact: string
  description: string
  businessHours: string // Could be more structured in a real app
  address: string
  pinCode: string
  location: {
    lat: number
    lng: number
  }
  images: string[] // Array of public URLs
  qrCodeUrl?: string
  distance?: number // For nearby salons
}

export interface Review {
  id: string
  salonId: string
  reviewerName?: string // Optional, if customer is not logged in
  rating: number // 1-5
  comment: string
  createdAt: string
}

export interface GoogleAuthResponse {
  token: string // JWT from your backend
  user: User
}

export interface NearbySalonsRequest {
  lat: number
  lng: number
}

export interface UploadUrlResponse {
  uploadUrl: string
  publicUrl: string
}

export interface ReviewFormValues {
  rating: number
  comment: string
}

export interface EditProfileFormValues {
  name: string
  contact: string
  description: string
  businessHours: string
  address: string
  pinCode: string
  lat: number
  lng: number
}

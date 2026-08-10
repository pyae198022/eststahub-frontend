export type UserRole = 'USER' | 'BUYER' | 'SELLER' | 'ADMIN'

export interface Pagination<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PropertyListItem {
  id: number
  title: string
  price: number
  township: string
  city: string
  propertyType: string
  listingType: string
  status: string
  coverImageUrl: string | null
}

export interface PropertyDetails {
  id: number
  title: string
  description: string
  propertyType: string
  listingType: string
  price: number
  township: string
  city: string
  status: string
  ownerId: number | null
  imageUrls: string[]
  viewCount: number
}

export interface UserProfile {
  id: number
  email: string
  fullName: string | null
  profileImageUrl: string | null
  bio: string | null
  phone: string | null
  role: UserRole | null
}

export interface ModificationResult<T> {
  id: T
  message?: string
}

export interface PropertySearchParams {
  keyword?: string
  township?: string
  listingType?: string
  propertyType?: string
  minPrice?: string
  maxPrice?: string
  sortBy?: string
  order?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export interface ProfilePayload {
  fullName: string
  profileImageUrl: string
  bio: string
  phone: string
}

export interface PropertyPayload {
  title: string
  description: string
  propertyType: string
  listingType: string
  price: number
  township: string
  city: string
  ownerId: number
}

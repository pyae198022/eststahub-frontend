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
  latitude: number | null
  longitude: number | null
  status: string
  ownerId: number | null
  ownerName: string | null
  ownerEmail: string | null
  imageUrls: string[]
  viewCount: number
}

export interface UserProfile {
  id: number
  email: string
  fullName: string | null
  profileImageUrl: string | null
  bio: string | null
  nrc: string | null
  phone: string | null
  role: UserRole | null
  createdAt: string | null
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
  bio?: string
}

export interface ProfilePayload {
  fullName: string
  profileImageUrl: string
  bio: string
  nrc: string
  phone: string
}

export interface PropertyDocumentItem {
  id: number
  documentName: string
  documentUrl: string
  uploadedAt: string
}

export interface PropertyPayload {
  title: string
  description: string
  propertyType: string
  listingType: string
  price: number
  township: string
  city: string
  latitude?: number
  longitude?: number
  ownerId: number
}

export interface InterestPayload {
  propertyId: number
  message: string
}

export type InterestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface InterestRequestItem {
  id: number
  propertyId: number | null
  propertyTitle: string | null
  requesterId: number | null
  requesterEmail: string | null
  requesterName: string | null
  requesterBio: string | null
  message: string | null
  status: InterestStatus
  createdAt: string
}

export interface PendingPropertyItem {
  id: number
  title: string
  propertyType: string
  listingType: string
  price: number
  township: string
  city: string
  ownerEmail: string | null
  ownerName: string | null
  createdAt: string
}

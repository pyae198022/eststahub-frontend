import axios from 'axios'

import { useAuthStore } from './auth-store'
import type {
  InterestPayload,
  InterestRequestItem,
  LoginPayload,
  ModificationResult,
  Pagination,
  PendingPropertyItem,
  ProfilePayload,
  PropertyDetails,
  PropertyDocumentItem,
  PropertyListItem,
  PropertyPayload,
  PropertySearchParams,
  RegisterPayload,
  UserProfile,
} from '../types/api'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? ''

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    const message = error.response?.data?.message
    if (message) {
      return Promise.reject(new Error(message))
    }

    return Promise.reject(error)
  },
)

export async function login(payload: LoginPayload) {
  const response = await api.post<string>('/auth/login', payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return response.data
}

export async function register(payload: RegisterPayload) {
  const response = await api.post<string>('/auth/register', payload)
  return response.data
}

export async function fetchProperties(params: PropertySearchParams) {
  const response = await api.get<Pagination<PropertyListItem>>('/properties/search', {
    params,
  })

  return response.data
}

export async function fetchMyListings() {
  const response = await api.get<PropertyListItem[]>('/properties/mine')
  return response.data
}

export async function fetchProperty(id: string) {
  const response = await api.get<PropertyDetails>(`/properties/${id}`)
  return response.data
}

export async function fetchProfile() {
  const response = await api.get<UserProfile>('/user/profile')
  return response.data
}

export async function fetchUserProfile(userId: number) {
  const response = await api.get<UserProfile>(`/user/profile/${userId}`)
  return response.data
}

export async function updateProfile(payload: ProfilePayload) {
  const response = await api.put<ModificationResult<number>>('/user/profile', payload)
  return response.data
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ModificationResult<number>>('/user/profile/image', formData)

  return response.data
}

export async function fetchPropertyDocuments(propertyId: number) {
  const response = await api.get<PropertyDocumentItem[]>(`/properties/${propertyId}/documents`)
  return response.data
}

export async function uploadPropertyDocument(propertyId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ModificationResult<number>>(
    `/properties/${propertyId}/documents`,
    formData,
  )

  return response.data
}

export async function deletePropertyDocument(propertyId: number, documentId: number) {
  const response = await api.delete<ModificationResult<number>>(
    `/properties/${propertyId}/documents/${documentId}`,
  )
  return response.data
}

export async function fetchWishlist(userId: number) {
  const response = await api.get<PropertyListItem[]>(`/wishlist/${userId}`)
  return response.data
}

export async function toggleWishlist(userId: number, propertyId: number) {
  const response = await api.post<ModificationResult<number>>('/wishlist/toggle', null, {
    params: { userId, propertyId },
  })

  return response.data
}

export async function createProperty(payload: PropertyPayload) {
  const response = await api.post<ModificationResult<number>>('/properties', payload)
  return response.data
}

export async function updateProperty(id: number, payload: PropertyPayload) {
  const response = await api.put<ModificationResult<number>>(`/properties/${id}`, payload)
  return response.data
}

export async function deleteProperty(id: number) {
  const response = await api.delete<ModificationResult<number>>(`/properties/${id}`)
  return response.data
}

export async function addPropertyImages(propertyId: number, urls: string[], coverIndex?: number) {
  const response = await api.post<ModificationResult<number>>(`/properties/${propertyId}/images`, urls, {
    params: { coverIndex },
  })
  return response.data
}

export async function uploadPropertyImages(propertyId: number, files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const response = await api.post<ModificationResult<number>>(
    `/properties/${propertyId}/images/upload`,
    formData,
  )
  return response.data
}

export async function submitInterest(payload: InterestPayload) {
  const response = await api.post<ModificationResult<number>>('/interests/request', payload)
  return response.data
}

export async function fetchMyInterests(propertyId: number) {
  const response = await api.get<InterestRequestItem[]>('/interests/mine', {
    params: { propertyId },
  })
  return response.data
}

export async function fetchPendingInterests() {
  const response = await api.get<InterestRequestItem[]>('/interests/admin/pending')
  return response.data
}

export async function fetchOwnerInterests(propertyId?: number) {
  const response = await api.get<InterestRequestItem[]>('/interests/owner', {
    params: propertyId != null ? { propertyId } : undefined,
  })
  return response.data
}

export async function decideInterest(id: number, action: 'approve' | 'reject') {
  const response = await api.put<ModificationResult<number>>(`/interests/${id}/${action}`)
  return response.data
}

export async function fetchPendingProperties() {
  const response = await api.get<PendingPropertyItem[]>('/properties/admin/pending')
  return response.data
}

export async function decideProperty(id: number, action: 'approve' | 'reject') {
  const response = await api.put<ModificationResult<number>>(`/properties/admin/${id}/${action}`)
  return response.data
}

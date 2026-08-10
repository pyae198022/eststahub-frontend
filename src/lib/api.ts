import axios from 'axios'

import { useAuthStore } from './auth-store'
import type {
  LoginPayload,
  ModificationResult,
  Pagination,
  ProfilePayload,
  PropertyDetails,
  PropertyListItem,
  PropertyPayload,
  PropertySearchParams,
  RegisterPayload,
  UserProfile,
} from '../types/api'

export const api = axios.create({
  baseURL: '/api',
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

export async function fetchProperty(id: string) {
  const response = await api.get<PropertyDetails>(`/properties/${id}`)
  return response.data
}

export async function fetchProfile() {
  const response = await api.get<UserProfile>('/user/profile')
  return response.data
}

export async function updateProfile(payload: ProfilePayload) {
  const response = await api.put<ModificationResult<number>>('/user/profile', payload)
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

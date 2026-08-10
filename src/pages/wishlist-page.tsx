import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchProfile, fetchWishlist, toggleWishlist } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { PropertyCard } from '../components/property-card'

export function WishlistPage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  const wishlistQuery = useQuery({
    queryKey: ['wishlist', profileQuery.data?.id],
    queryFn: () => fetchWishlist(profileQuery.data!.id),
    enabled: Boolean(profileQuery.data?.id),
  })

  const mutation = useMutation({
    mutationFn: async (propertyId: number) => toggleWishlist(profileQuery.data!.id, propertyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Saved homes</p>
        <h1 className="text-4xl font-semibold text-white">Your wishlist</h1>
        <p className="text-slate-400">
          This page uses the backend’s current `userId`-based wishlist endpoints.
        </p>
      </div>

      {wishlistQuery.isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          Loading wishlist...
        </div>
      ) : null}

      {wishlistQuery.data?.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlistQuery.data.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              wishlisted
              onWishlistClick={(propertyId) => mutation.mutate(propertyId)}
            />
          ))}
        </div>
      ) : null}

      {!wishlistQuery.isLoading && !wishlistQuery.data?.length ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 p-10 text-center text-slate-300">
          Your wishlist is empty.
        </div>
      ) : null}
    </div>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Heart, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { fetchProfile, fetchProperty, toggleWishlist } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { formatPrice } from '../lib/utils'

export function PropertyPage() {
  const { id = '' } = useParams()
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const propertyQuery = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
    enabled: Boolean(id),
    retry: false,
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    retry: false,
  })

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!profileQuery.data?.id || !propertyQuery.data?.id) {
        throw new Error('Login first to add this property to your wishlist.')
      }

      return toggleWishlist(profileQuery.data.id, propertyQuery.data.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  if (propertyQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
        Loading property details...
      </div>
    )
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    return (
      <div className="space-y-4 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-8 text-rose-100">
        <h1 className="text-2xl font-semibold">Property unavailable</h1>
        <p>
          This endpoint currently appears protected by the backend. If you want public detail
          pages, add `GET /api/properties/{'{id}'}` to the permit list in Spring Security.
        </p>
        <Link to="/" className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
          Back to listings
        </Link>
      </div>
    )
  }

  const property = propertyQuery.data

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
            {property.imageUrls[0] ? (
              <img
                src={property.imageUrls[0]}
                alt={property.title}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-emerald-500/20 to-sky-500/10 text-slate-300">
                No hero image
              </div>
            )}
          </div>

          {property.imageUrls.length > 1 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {property.imageUrls.slice(1).map((imageUrl) => (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={property.title}
                  className="aspect-[4/3] w-full rounded-3xl border border-white/10 object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                {property.listingType}
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-white">{property.title}</h1>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
              {property.status}
            </span>
          </div>

          <p className="text-4xl font-bold text-white">{formatPrice(property.price)}</p>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-emerald-300" />
              {property.township}, {property.city}
            </p>
            <p className="flex items-center gap-2">
              <Eye className="size-4 text-emerald-300" />
              {property.viewCount} views
            </p>
            <p>Property type: {property.propertyType}</p>
            <p>Owner ID: {property.ownerId ?? 'Unknown'}</p>
          </div>

          <button
            type="button"
            onClick={() => wishlistMutation.mutate()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
          >
            <Heart className="size-4" />
            Save to wishlist
          </button>

          {wishlistMutation.isError ? (
            <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {(wishlistMutation.error as Error).message}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Description</h2>
        <p className="mt-4 whitespace-pre-line text-slate-300">{property.description}</p>
      </section>
    </div>
  )
}

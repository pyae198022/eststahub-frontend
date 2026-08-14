import { useQuery } from '@tanstack/react-query'
import { FileText, MapPin, PlusSquare, Users } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { fetchMyListings, fetchOwnerInterests, fetchProfile } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { formatPrice } from '../lib/utils'

export function MyListingsPage() {
  const token = useAuthStore((state) => state.token)

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    retry: false,
  })

  const listingsQuery = useQuery({
    queryKey: ['my-listings'],
    queryFn: fetchMyListings,
    enabled: Boolean(token),
    retry: false,
  })

  const sellerInterestsQuery = useQuery({
    queryKey: ['seller-interests'],
    queryFn: () => fetchOwnerInterests(),
    enabled: Boolean(token),
    retry: false,
  })

  const confirmedByProperty = (sellerInterestsQuery.data ?? []).reduce<Record<number, number>>(
    (acc, request) => {
      if (request.propertyId != null) {
        acc[request.propertyId] = (acc[request.propertyId] ?? 0) + 1
      }
      return acc
    },
    {},
  )

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (profileQuery.data && profileQuery.data.role !== 'SELLER') {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-amber-300/80">Seller hub</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">My listings</h1>
          <p className="mt-2 text-slate-400">
            Manage your properties and their legal documents.
          </p>
        </div>
        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          <PlusSquare className="size-4" />
          Create listing
        </Link>
      </div>

      {listingsQuery.isLoading ? (
        <p className="mt-8 text-slate-400">Loading your listings...</p>
      ) : null}

      {listingsQuery.isError ? (
        <p className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {(listingsQuery.error as Error).message}
        </p>
      ) : null}

      {listingsQuery.data?.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listingsQuery.data.map((property) => (
            <article
              key={property.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                {property.coverImageUrl ? (
                  <img
                    src={property.coverImageUrl}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-950/80 to-slate-900/60">
                    <MapPin className="size-8 text-amber-300/50" />
                    <span className="text-sm text-slate-400">No image</span>
                  </div>
                )}
                <span
                  className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm ${
                    property.status === 'AVAILABLE'
                      ? 'border border-amber-400/30 bg-amber-400/15 text-amber-200'
                      : property.status === 'PENDING'
                        ? 'border border-sky-400/30 bg-sky-400/15 text-sky-200'
                        : 'border border-rose-400/30 bg-rose-400/15 text-rose-200'
                  }`}
                >
                  {property.status}
                </span>
                {confirmedByProperty[property.id] ? (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 shadow-lg shadow-black/20">
                    <Users className="size-3.5" />
                    {confirmedByProperty[property.id]}{' '}
                    {confirmedByProperty[property.id] === 1 ? 'buyer' : 'buyers'}
                  </span>
                ) : null}
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <h3 className="truncate text-lg font-semibold text-white">{property.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {property.township}, {property.city}
                    </span>
                  </p>
                  <p className="mt-2 text-xl font-bold text-white">
                    {formatPrice(property.price)}
                  </p>
                </div>

                <div className="grid gap-2 border-t border-white/5 pt-4">
                  <Link
                    to={`/properties/${property.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                  >
                    <FileText className="size-4" />
                    Manage legal documents
                  </Link>
                  <Link
                    to={`/edit-listing/${property.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-white"
                  >
                    Edit listing
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
          <p>You have no listings yet.</p>
          <Link
            to="/create-listing"
            className="mt-4 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            Create your first listing
          </Link>
        </div>
      )}
    </div>
  )
}

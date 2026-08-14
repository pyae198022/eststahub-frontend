import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { fetchProfile, fetchProperties, fetchWishlist, toggleWishlist } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { PropertyCard } from '../components/property-card'

const initialFilters = {
  keyword: '',
  township: '',
  listingType: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'id',
  order: 'DESC' as 'ASC' | 'DESC',
  size: 9,
}

const PAGE_SIZE = 9

export function HomePage() {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(0)
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const patchFilters = (updates: Partial<typeof initialFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
    setPage(0)
  }

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    retry: false,
  })

  const wishlistQuery = useQuery({
    queryKey: ['wishlist', profileQuery.data?.id],
    queryFn: () => fetchWishlist(profileQuery.data!.id),
    enabled: Boolean(profileQuery.data?.id),
  })

  const propertiesQuery = useQuery({
    queryKey: ['properties', filters, page],
    queryFn: () => fetchProperties({ ...filters, page, size: PAGE_SIZE }),
  })

  const wishlistIds = useMemo(
    () => new Set((wishlistQuery.data ?? []).map((item) => item.id)),
    [wishlistQuery.data],
  )

  const toggleWishlistMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      if (!profileQuery.data?.id) {
        throw new Error('Please login to manage your wishlist.')
      }

      return toggleWishlist(profileQuery.data.id, propertyId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] p-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
            <SlidersHorizontal className="size-4" />
            EstateHub — find your next address
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Find your dream home.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              Verified homes, condos &amp; land across Myanmar.
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
            <Search className="size-4 shrink-0 text-amber-300" />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Keyword"
              value={filters.keyword}
              onChange={(event) => patchFilters({ keyword: event.target.value })}
            />
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
            <MapPin className="size-4 shrink-0 text-amber-300" />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Township"
              value={filters.township}
              onChange={(event) => patchFilters({ township: event.target.value })}
            />
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Min
            </span>
            <input
              type="number"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Price"
              value={filters.minPrice}
              onChange={(event) => patchFilters({ minPrice: event.target.value })}
            />
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Max
            </span>
            <input
              type="number"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Price"
              value={filters.maxPrice}
              onChange={(event) => patchFilters({ maxPrice: event.target.value })}
            />
          </label>
          </div>
        </div>
      </section>

      {toggleWishlistMutation.isError ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {(toggleWishlistMutation.error as Error).message}
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Property inventory</h2>
            <p className="text-slate-400">
              {propertiesQuery.data
                ? propertiesQuery.data.totalElements === 0
                  ? '0 results'
                  : `Showing ${page * PAGE_SIZE + 1}–${Math.min(
                      (page + 1) * PAGE_SIZE,
                      propertiesQuery.data.totalElements,
                    )} of ${propertiesQuery.data.totalElements} results`
                : '0 results from the live backend search endpoint.'}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              value={filters.listingType}
              onChange={(event) => patchFilters({ listingType: event.target.value })}
            >
              <option value="">Any listing type</option>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              value={filters.propertyType}
              onChange={(event) => patchFilters({ propertyType: event.target.value })}
            >
              <option value="">Any property type</option>
              <option value="CONDO">Condo</option>
              <option value="HOUSE">House</option>
              <option value="LAND">Land</option>
              <option value="APARTMENT">Apartment</option>
            </select>
          </div>
        </div>

        {propertiesQuery.isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            Loading properties...
          </div>
        ) : null}

        {propertiesQuery.data?.content?.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {propertiesQuery.data.content.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                wishlisted={wishlistIds.has(property.id)}
                onWishlistClick={
                  profileQuery.data?.role === 'ADMIN'
                    ? undefined
                    : (propertyId) => {
                        if (!token) {
                          navigate('/login')
                          return
                        }
                        toggleWishlistMutation.mutate(propertyId)
                      }
                }
              />
            ))}
          </div>
        ) : null}

        {!propertiesQuery.isLoading && !propertiesQuery.data?.content?.length ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 p-10 text-center text-slate-300">
            No properties matched these filters.
          </div>
        ) : null}

        {propertiesQuery.data && propertiesQuery.data.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-slate-400">
              Page {page + 1} of {propertiesQuery.data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= propertiesQuery.data.totalPages - 1}
              onClick={() => setPage((prev) => Math.min(propertiesQuery.data.totalPages - 1, prev + 1))}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'

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
  page: 0,
  size: 9,
}

export function HomePage() {
  const [filters, setFilters] = useState(initialFilters)
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

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
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
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
      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] p-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            <SlidersHorizontal className="size-4" />
            Designed for the Spring Boot estate API in this folder
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Modern real estate browsing with a clean TypeScript frontend.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              This starter is already wired to JWT auth, property search, wishlist,
              profile management, and seller listing creation.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Search className="size-5 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">Search filters</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
              placeholder="Keyword"
              value={filters.keyword}
              onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
            />
            <input
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Township"
              value={filters.township}
              onChange={(event) => setFilters((prev) => ({ ...prev, township: event.target.value }))}
            />
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              value={filters.listingType}
              onChange={(event) => setFilters((prev) => ({ ...prev, listingType: event.target.value }))}
            >
              <option value="">Any listing type</option>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              value={filters.propertyType}
              onChange={(event) => setFilters((prev) => ({ ...prev, propertyType: event.target.value }))}
            >
              <option value="">Any property type</option>
              <option value="CONDO">Condo</option>
              <option value="HOUSE">House</option>
              <option value="LAND">Land</option>
              <option value="APARTMENT">Apartment</option>
            </select>
            <input
              type="number"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Minimum price"
              value={filters.minPrice}
              onChange={(event) => setFilters((prev) => ({ ...prev, minPrice: event.target.value }))}
            />
            <input
              type="number"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Maximum price"
              value={filters.maxPrice}
              onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: event.target.value }))}
            />
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
              {propertiesQuery.data?.totalElements ?? 0} results from the live backend search
              endpoint.
            </p>
          </div>
          <p className="max-w-xl text-sm text-slate-500">
            Public browsing works best once the backend also opens `GET /api/properties/{'{id}'}`.
            Right now only search is explicitly public in Spring Security.
          </p>
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
                onWishlistClick={token ? (propertyId) => toggleWishlistMutation.mutate(propertyId) : undefined}
              />
            ))}
          </div>
        ) : null}

        {!propertiesQuery.isLoading && !propertiesQuery.data?.content?.length ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 p-10 text-center text-slate-300">
            No properties matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  )
}

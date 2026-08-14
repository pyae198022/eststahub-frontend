import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Heart, MapPin, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteProperty, fetchMyInterests, fetchOwnerInterests, fetchProfile, fetchProperty, submitInterest, toggleWishlist } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { PropertyMap } from '../components/property-map'
import { formatPrice } from '../lib/utils'

export function PropertyPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [activeIndex, setActiveIndex] = useState(0)
  const [interestMessage, setInterestMessage] = useState('')

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

  const deleteMutation = useMutation({
    mutationFn: () => deleteProperty(Number(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      navigate('/')
    },
  })

  const interestQuery = useQuery({
    queryKey: ['interests-mine', propertyQuery.data?.id],
    queryFn: () => fetchMyInterests(propertyQuery.data!.id),
    enabled: Boolean(token && propertyQuery.data?.id),
    retry: false,
  })

  const interestMutation = useMutation({
    mutationFn: (message: string) => submitInterest({ propertyId: propertyQuery.data!.id, message }),
    onSuccess: async () => {
      setInterestMessage('')
      await queryClient.invalidateQueries({ queryKey: ['interests-mine', propertyQuery.data?.id] })
    },
  })

  const ownerInterestsQuery = useQuery({
    queryKey: ['interests-owner', propertyQuery.data?.id],
    queryFn: () => fetchOwnerInterests(propertyQuery.data!.id),
    enabled: Boolean(
      profileQuery.data?.role === 'SELLER' &&
        propertyQuery.data?.ownerId &&
        propertyQuery.data.ownerId === profileQuery.data.id &&
        propertyQuery.data?.id,
    ),
    retry: false,
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

  const isOwner = Boolean(
    profileQuery.data?.role === 'SELLER' &&
      property.ownerId != null &&
      property.ownerId === profileQuery.data.id,
  )

  const images = property.imageUrls
  const goTo = (index: number) => setActiveIndex((index + images.length) % images.length)

  return (
    <div>
      <div className="mb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      <div className="space-y-8">
        <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
            {images[activeIndex] ? (
              <img
                key={activeIndex}
                src={images[activeIndex]}
                alt={property.title}
                className="aspect-[16/9] w-full animate-fade-in object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-emerald-500/20 to-sky-500/10 text-slate-300">
                No hero image
              </div>
            )}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/70 p-2 text-white opacity-0 transition hover:bg-slate-950 group-hover:opacity-100"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/70 p-2 text-white opacity-0 transition hover:bg-slate-950 group-hover:opacity-100"
                >
                  <ChevronRight className="size-5" />
                </button>
                <span className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200">
                  {activeIndex + 1} / {images.length}
                </span>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((imageUrl, index) => (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`View image ${index + 1}`}
                  className={`shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                    index === activeIndex
                      ? 'border-emerald-400/80'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${property.title} ${index + 1}`}
                    className="aspect-[4/3] w-24 object-cover"
                  />
                </button>
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
            {property.latitude != null && property.longitude != null ? (
              <p>
                Location: {property.latitude.toFixed(5)}, {property.longitude.toFixed(5)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => wishlistMutation.mutate()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
          >
            <Heart className="size-4" />
            Save to wishlist
          </button>

          {isOwner ? (
            <div>
              <div className="mb-6 border-t border-white/10" />
              <div className="flex gap-3">
              <Link
                to={`/edit-listing/${property.id}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
              >
                <Pencil className="size-4" />
                Edit listing
              </Link>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm('Delete this listing permanently?')) {
                    deleteMutation.mutate()
                  }
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rose-400/30 px-5 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
              >
                <Trash2 className="size-4" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              </div>
            </div>
          ) : null}

          {deleteMutation.isError ? (
            <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {(deleteMutation.error as Error).message}
            </p>
          ) : null}

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

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Interested in this property?</h2>
        <p className="mt-2 text-slate-400">
          Send a request and our admin team will confirm your interest.
        </p>

        {!token ? (
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
          >
            Login to express interest
          </Link>
        ) : interestQuery.isLoading ? (
          <p className="mt-6 text-sm text-slate-400">Checking your requests...</p>
        ) : interestQuery.data?.some((request) => request.status === 'PENDING') ? (
          <p className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Request sent — awaiting admin confirmation.
          </p>
        ) : interestQuery.data?.some((request) => request.status === 'APPROVED') ? (
          <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Your interest request was approved by the admin.
          </p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              interestMutation.mutate(interestMessage)
            }}
          >
            <textarea
              rows={3}
              placeholder="Message to the admin (optional)"
              value={interestMessage}
              onChange={(event) => setInterestMessage(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={interestMutation.isPending}
              className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {interestMutation.isPending ? 'Sending...' : 'Send interest request'}
            </button>
            {interestMutation.isSuccess ? (
              <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Request sent — awaiting admin confirmation.
              </p>
            ) : null}
            {interestMutation.isError ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {(interestMutation.error as Error).message}
              </p>
            ) : null}
          </form>
        )}
      </section>

      {isOwner ? (
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-white">Interested buyers</h2>
          <p className="mt-2 text-slate-400">
            Buyers the admin confirmed for this listing. Contact them to close the deal.
          </p>

          {ownerInterestsQuery.isLoading ? (
            <p className="mt-6 text-sm text-slate-400">Loading confirmed buyers...</p>
          ) : null}

          {ownerInterestsQuery.data?.length ? (
            <div className="mt-6 space-y-4">
              {ownerInterestsQuery.data.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"
                >
                  <p className="font-semibold text-white">
                    {request.requesterName ?? 'Anonymous buyer'}
                  </p>
                  <a
                    href={`mailto:${request.requesterEmail ?? ''}`}
                    className="text-sm text-emerald-300 underline-offset-2 hover:underline"
                  >
                    {request.requesterEmail}
                  </a>
                  {request.message ? (
                    <p className="mt-3 rounded-xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                      "{request.message}"
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-slate-500">
                    Confirmed {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {!ownerInterestsQuery.isLoading && !ownerInterestsQuery.data?.length ? (
            <p className="mt-6 text-sm text-slate-500">
              No confirmed buyers yet. Requests appear here once the admin approves them.
            </p>
          ) : null}
        </section>
      ) : null}

      {property.latitude != null && property.longitude != null ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Location</h2>
          <div className="overflow-hidden rounded-[32px] border border-white/10">
            <PropertyMap
              latitude={property.latitude}
              longitude={property.longitude}
              title={property.title}
            />
          </div>
        </section>
      ) : null}
      </div>
    </div>
  )
}

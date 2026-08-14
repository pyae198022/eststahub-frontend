import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { decideInterest, decideProperty, fetchPendingInterests, fetchPendingProperties, fetchProfile } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { formatPrice } from '../lib/utils'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function AdminPage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    retry: false,
  })

  const pendingQuery = useQuery({
    queryKey: ['interests-pending'],
    queryFn: fetchPendingInterests,
    enabled: Boolean(token && profileQuery.data?.role === 'ADMIN'),
  })

  const pendingPropertiesQuery = useQuery({
    queryKey: ['properties-pending'],
    queryFn: fetchPendingProperties,
    enabled: Boolean(token && profileQuery.data?.role === 'ADMIN'),
  })

  const decideMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      decideInterest(id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interests-pending'] })
    },
  })

  const propertyMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      decideProperty(id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties-pending'] })
      void queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (profileQuery.data && profileQuery.data.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-white">Admin panel</h1>
        <p className="mt-2 text-slate-400">
          Confirm new property listings and buyer interest requests.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Pending listings</h2>
        <p className="text-sm text-slate-400">
          Properties posted by sellers stay hidden until you approve them.
        </p>

        {pendingPropertiesQuery.isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            Loading pending listings...
          </div>
        ) : null}

        {pendingPropertiesQuery.data?.length ? (
          <div className="space-y-4">
            {pendingPropertiesQuery.data.map((property) => (
              <div
                key={property.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="text-lg font-semibold text-white">
                    {property.title}
                    <span className="ml-3 font-normal text-emerald-300">
                      {formatPrice(property.price)}
                    </span>
                  </p>
                  <p className="text-slate-300">
                    {property.township}, {property.city} · {property.propertyType} ·{' '}
                    {property.listingType}
                  </p>
                  <p className="text-slate-400">
                    Posted by {property.ownerName ?? 'Unknown'} ({property.ownerEmail})
                  </p>
                  <p className="text-xs text-slate-500">Posted {formatDate(property.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    disabled={propertyMutation.isPending}
                    onClick={() => propertyMutation.mutate({ id: property.id, action: 'approve' })}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    <Check className="size-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={propertyMutation.isPending}
                    onClick={() => propertyMutation.mutate({ id: property.id, action: 'reject' })}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-5 py-2 font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    <X className="size-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!pendingPropertiesQuery.isLoading && !pendingPropertiesQuery.data?.length ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 p-10 text-center text-slate-300">
            No pending listings. All posted properties have been reviewed.
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Interest requests</h2>
        <p className="text-sm text-slate-400">
          Confirm or reject buyer interest so sellers can contact confirmed buyers.
        </p>

      {pendingQuery.isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          Loading interest requests...
        </div>
      ) : null}

      {pendingQuery.data?.length ? (
        <div className="space-y-4">
          {pendingQuery.data.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 space-y-1 text-sm">
                <p className="text-lg font-semibold text-white">
                  {request.propertyTitle ?? `Property #${request.propertyId}`}
                </p>
                <p className="text-slate-300">
                  {request.requesterName ?? 'Anonymous'} ({request.requesterEmail})
                </p>
                <p className="truncate text-slate-400">
                  {request.message || 'No message provided'}
                </p>
                <p className="text-xs text-slate-500">Requested {formatDate(request.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ id: request.id, action: 'approve' })}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  <Check className="size-4" />
                  Confirm
                </button>
                <button
                  type="button"
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ id: request.id, action: 'reject' })}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-5 py-2 font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
                >
                  <X className="size-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!pendingQuery.isLoading && !pendingQuery.data?.length ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 p-10 text-center text-slate-300">
          No pending interest requests.
        </div>
      ) : null}
      </section>

      {propertyMutation.isError ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {(propertyMutation.error as Error).message}
        </p>
      ) : null}

      {decideMutation.isError ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {(decideMutation.error as Error).message}
        </p>
      ) : null}

      <p className="text-sm text-slate-500">
        Buyers can re-request after a rejection. Confirmed buyers see an approval message on the
        property page. <Link to="/" className="text-emerald-300 hover:underline">Back to listings</Link>
      </p>
    </div>
  )
}
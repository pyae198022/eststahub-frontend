import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, Mail, Phone } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { fetchUserProfile } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'

export function ViewProfilePage() {
  const { id } = useParams()
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()

  const profileQuery = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => fetchUserProfile(Number(id)),
    enabled: Boolean(token && id),
    retry: false,
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (profileQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
        Loading profile...
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-8 text-rose-100">
        <h1 className="text-2xl font-semibold">Profile unavailable</h1>
        <p className="mt-2">{(profileQuery.error as Error).message}</p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Back to listings
        </Link>
      </div>
    )
  }

  const profile = profileQuery.data
  const displayName = profile.fullName ?? 'Member'
  const profileInitial = (profile.fullName ?? profile.email ?? 'M').charAt(0).toUpperCase()

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="h-4" />

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
        <div className="relative h-40 bg-gradient-to-r from-blue-800/70 via-indigo-900/60 to-slate-900/70 sm:h-52">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_120%,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/50 to-transparent" />
        </div>

        <div className="px-6 pb-8 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="relative -mt-16 shrink-0 sm:-mt-20">
              <div className="rounded-full bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 p-1 shadow-2xl shadow-amber-500/10">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={displayName}
                    className="size-32 rounded-full object-cover ring-4 ring-slate-950 sm:size-40"
                  />
                ) : (
                  <div className="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-900 text-5xl font-bold text-white ring-4 ring-slate-950 sm:size-40">
                    {profileInitial}
                  </div>
                )}
              </div>

              <span
                title="Verified member"
                className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 ring-4 ring-slate-950"
              >
                <BadgeCheck className="size-4" />
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-3xl font-semibold text-white">{displayName}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                  <BadgeCheck className="size-3.5" />
                  {profile.role ?? 'Member'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{profile.email}</p>

              {profile.bio ? (
                <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${profile.email ?? ''}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                >
                  <Mail className="size-4" />
                  Email {profile.fullName?.split(' ')[0] ?? 'member'}
                </a>
                <a
                  href={`tel:${profile.phone ?? ''}`}
                  className={
                    profile.phone
                      ? 'inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:border-amber-400/40 hover:bg-amber-500/10'
                      : 'pointer-events-none inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-600'
                  }
                >
                  <Phone className="size-4" />
                  {profile.phone || 'No phone listed'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/80">Member information</p>
        <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-slate-300">
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="mt-1">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Phone</p>
            <p className="mt-1">{profile.phone || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">NRC number</p>
            <p className="mt-1">{profile.nrc || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Member since</p>
            <p className="mt-1">
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : '...'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'

import { fetchProfile, updateProfile } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  profileImageUrl: z.string().url('Enter a valid URL.').or(z.literal('')),
  bio: z.string().max(300, 'Keep the bio short and clear.'),
  phone: z.string().max(50, 'Phone number is too long.'),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      profileImageUrl: '',
      bio: '',
      phone: '',
    },
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName ?? '',
        profileImageUrl: profileQuery.data.profileImageUrl ?? '',
        bio: profileQuery.data.bio ?? '',
        phone: profileQuery.data.phone ?? '',
      })
    }
  }, [profileQuery.data, reset])

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">My account</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Profile settings</h1>
        <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-slate-300">
          <p>
            <span className="text-slate-500">Email:</span> {profileQuery.data?.email ?? 'Loading...'}
          </p>
          <p>
            <span className="text-slate-500">Role:</span> {profileQuery.data?.role ?? 'Unknown'}
          </p>
          <p>
            <span className="text-slate-500">User ID:</span> {profileQuery.data?.id ?? '...'}
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <form
          className="space-y-5"
          onSubmit={handleSubmit((values) => profileMutation.mutate(values))}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="profile-fullName">
              Full name
            </label>
            <input
              id="profile-fullName"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              {...register('fullName')}
            />
            {errors.fullName ? (
              <p className="text-sm text-rose-300">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="profile-image">
              Profile image URL
            </label>
            <input
              id="profile-image"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              {...register('profileImageUrl')}
            />
            {errors.profileImageUrl ? (
              <p className="text-sm text-rose-300">{errors.profileImageUrl.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="profile-phone">
              Phone
            </label>
            <input
              id="profile-phone"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              {...register('phone')}
            />
            {errors.phone ? <p className="text-sm text-rose-300">{errors.phone.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="profile-bio">
              Bio
            </label>
            <textarea
              id="profile-bio"
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              {...register('bio')}
            />
            {errors.bio ? <p className="text-sm text-rose-300">{errors.bio.message}</p> : null}
          </div>

          {profileMutation.isSuccess ? (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Profile updated successfully.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
          >
            {profileMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Camera, Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'

import { fetchProfile, updateProfile, uploadProfileImage } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  nrc: z
    .string()
    .max(30, 'NRC number is too long.')
    .regex(/^\d{1,2}\/[A-Za-z]{1,6}\([A-Za-z]\)\d{6}$/, 'Use the Myanmar NRC format, e.g. 12/KAPATA(N)123456')
    .or(z.literal('')),
  phone: z.string().max(50, 'Phone number is too long.'),
  bio: z.string().max(300, 'Keep the bio short and clear.'),
})

type ProfileValues = z.infer<typeof profileSchema>

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ProfilePage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      nrc: '',
      phone: '',
      bio: '',
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
        nrc: profileQuery.data.nrc ?? '',
        phone: profileQuery.data.phone ?? '',
        bio: profileQuery.data.bio ?? '',
      })
    }
  }, [profileQuery.data, reset])

  const imageMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: async () => {
      setPreviewUrl(null)
      setPickError(null)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const profileMutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      updateProfile({
        ...values,
        profileImageUrl: profileQuery.data?.profileImageUrl ?? '',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPickError('Only JPG, PNG, WebP or GIF images are allowed.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setPickError('Image is too large. Maximum size is 10MB.')
      event.target.value = ''
      return
    }

    setPickError(null)
    setPreviewUrl(URL.createObjectURL(file))
    imageMutation.mutate(file)
    event.target.value = ''
  }

  const currentImage = previewUrl ?? profileQuery.data?.profileImageUrl ?? null
  const displayName = profileQuery.data?.fullName ?? 'You'
  const roleLabel =
    profileQuery.data?.role?.toLowerCase() === 'seller' ? 'Seller' : 'Account'

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
        <div className="relative h-36 bg-gradient-to-r from-blue-800/70 via-indigo-900/60 to-slate-900/70 sm:h-44">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_120%,rgba(255,255,255,0.15),transparent_60%)]" />
        </div>

        <div className="px-6 pb-8 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="-mt-16 sm:-mt-20">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageMutation.isPending}
                title="Change profile photo"
                className="group relative block"
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="Profile"
                    className="size-28 rounded-3xl border-4 border-slate-950 object-cover shadow-2xl transition group-hover:opacity-90 sm:size-36"
                  />
                ) : (
                  <div className="flex size-28 items-center justify-center rounded-3xl border-4 border-slate-950 bg-slate-900 text-4xl font-semibold text-slate-500 shadow-2xl sm:size-36">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-950/60 opacity-0 transition group-hover:opacity-100">
                  {imageMutation.isPending ? (
                    <Loader2 className="size-6 animate-spin text-amber-300" />
                  ) : (
                    <Camera className="size-6 text-white" />
                  )}
                </span>
              </button>
            </div>

            <div className="min-w-0 flex-1 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-3xl font-semibold text-white">{displayName}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                  <BadgeCheck className="size-3.5" />
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{profileQuery.data?.email ?? 'Loading...'}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
                >
                  {imageMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {imageMutation.isPending ? 'Uploading...' : currentImage ? 'Change photo' : 'Upload photo'}
                </button>
                <p className="text-xs text-slate-500">
                  JPG, PNG, WebP or GIF · up to 10MB
                </p>
              </div>

              {pickError ? (
                <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">
                  {pickError}
                </p>
              ) : null}

              {imageMutation.isSuccess ? (
                <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100">
                  Profile photo updated.
                </p>
              ) : null}

              {imageMutation.isError ? (
                <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">
                  {(imageMutation.error as Error).message}
                </p>
              ) : null}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-amber-300/80">Account details</p>
          <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-slate-300">
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1">{profileQuery.data?.email ?? 'Loading...'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <p className="mt-1">{profileQuery.data?.role ?? 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">NRC number</p>
              <p className="mt-1">{profileQuery.data?.nrc || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bio</p>
              <p className="mt-1 whitespace-pre-line">
                {profileQuery.data?.bio || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="mt-1">{profileQuery.data?.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Member since</p>
              <p className="mt-1">
                {profileQuery.data?.createdAt
                  ? new Date(profileQuery.data.createdAt).toLocaleDateString()
                  : '...'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-amber-300/80">Personal information</p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit((values) => profileMutation.mutate(values))}>
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
              <label className="text-sm text-slate-300" htmlFor="profile-nrc">
                NRC number
              </label>
              <input
                id="profile-nrc"
                placeholder="e.g. 12/KAPATA(N)123456"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                {...register('nrc')}
              />
              <p className="text-xs text-slate-500">
                Myanmar National Registration Card number, e.g. 12/KAPATA(N)123456.
              </p>
              {errors.nrc ? <p className="text-sm text-rose-300">{errors.nrc.message}</p> : null}
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
              <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Profile updated successfully.
              </p>
            ) : null}

            {profileMutation.isError ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {(profileMutation.error as Error).message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {profileMutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
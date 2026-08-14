import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Link as LinkIcon, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { Navigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import {
  addPropertyImages,
  createProperty,
  fetchProfile,
  fetchProperty,
  updateProperty,
  uploadPropertyImages,
} from '../lib/api'
import { useAuthStore } from '../lib/auth-store'

const createListingSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(20, 'Add a more useful description.'),
  propertyType: z.string().min(2, 'Property type is required.'),
  listingType: z.string().min(2, 'Listing type is required.'),
  price: z.number().positive('Price must be greater than zero.'),
  township: z.string().min(2, 'Township is required.'),
  city: z.string().min(2, 'City is required.'),
  latitude: z.preprocess(
    (value) => (Number.isNaN(value as number) ? undefined : value),
    z.number().min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.').optional(),
  ),
  longitude: z.preprocess(
    (value) => (Number.isNaN(value as number) ? undefined : value),
    z.number().min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.').optional(),
  ),
})

type CreateListingValues = z.infer<typeof createListingSchema>

const createListingResolver = zodResolver(createListingSchema) as unknown as Resolver<CreateListingValues>

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function CreateListingPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  const propertyQuery = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id ?? ''),
    enabled: editing,
    retry: false,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateListingValues>({
    resolver: createListingResolver,
    defaultValues: {
      title: '',
      description: '',
      propertyType: 'CONDO',
      listingType: 'SALE',
      price: 0,
      township: '',
      city: '',
      latitude: undefined,
      longitude: undefined,
    },
  })

  useEffect(() => {
    if (propertyQuery.data) {
      reset({
        title: propertyQuery.data.title,
        description: propertyQuery.data.description,
        propertyType: propertyQuery.data.propertyType,
        listingType: propertyQuery.data.listingType,
        price: propertyQuery.data.price,
        township: propertyQuery.data.township,
        city: propertyQuery.data.city,
        latitude: propertyQuery.data.latitude ?? undefined,
        longitude: propertyQuery.data.longitude ?? undefined,
      })
    }
  }, [propertyQuery.data, reset])

  const attachImages = async (propertyId: number) => {
    if (pendingFiles.length > 0) {
      await uploadPropertyImages(propertyId, pendingFiles)
    }
    if (imageUrls.length > 0) {
      await addPropertyImages(propertyId, imageUrls)
    }
  }

  const mutation = useMutation({
    mutationFn: async (values: CreateListingValues) => {
      if (!profileQuery.data?.id) {
        throw new Error('Login first so the backend can resolve the owner ID.')
      }

      const payload = {
        ...values,
        ownerId: profileQuery.data.id,
      }

      const result =
        editing && id
          ? await updateProperty(Number(id), payload)
          : await createProperty(payload)

      if (imageUrls.length > 0 || pendingFiles.length > 0) {
        await attachImages(result.id)
      }
      return result
    },
    onSuccess: async () => {
      if (!editing) {
        reset()
        setImageUrls([])
        setPendingFiles([])
      }
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (profileQuery.data && profileQuery.data.role !== 'SELLER' && profileQuery.data.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  if (
    editing &&
    propertyQuery.isSuccess &&
    profileQuery.data?.role !== 'ADMIN' &&
    (!propertyQuery.data.ownerId || propertyQuery.data.ownerId !== profileQuery.data?.id)
  ) {
    return <Navigate to="/" replace />
  }

  const handleAddUrl = () => {
    const value = urlInput.trim()
    if (!value) {
      return
    }
    if (!/^https?:\/\/.+/.test(value)) {
      setImageError('Image URL must start with http:// or https://')
      return
    }
    setImageError(null)
    setImageUrls((prev) => [...prev, value])
    setUrlInput('')
  }

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageError('Only JPG, PNG, WebP or GIF images are allowed.')
        event.target.value = ''
        return
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError('Image is too large. Maximum size is 10MB.')
        event.target.value = ''
        return
      }
    }
    setImageError(null)
    setPendingFiles((prev) => [...prev, ...files])
    event.target.value = ''
  }

  const existingImages = editing ? (propertyQuery.data?.imageUrls ?? []) : []
  const totalPhotos = existingImages.length + pendingFiles.length + imageUrls.length

  const submitted = mutation.isSuccess || mutation.isPending

  const validatePhotos = (count: number) => {
    if (count < 3) {
      setImageError(`Please add at least 3 photos (${count} added).`)
      return false
    }
    setImageError(null)
    return true
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/80">Seller tools</p>
        <h1 className="text-4xl font-semibold text-white">
          {editing ? 'Edit property listing' : 'Create a property listing'}
        </h1>
        <p className="text-slate-400">
          {editing
            ? 'Update the details of your property listing.'
            : 'The backend requires `ownerId` in the property payload, so this form uses the current profile ID automatically.'}
        </p>
      </div>

      <form
        className="mt-8 grid gap-5 md:grid-cols-2"
        onSubmit={handleSubmit((values) => {
          if (!validatePhotos(totalPhotos)) {
            return
          }
          mutation.mutate(values)
        })}
      >
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-slate-300" htmlFor="listing-title">
            Title
          </label>
          <input
            id="listing-title"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('title')}
          />
          {errors.title ? <p className="text-sm text-rose-300">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-slate-300" htmlFor="listing-description">
            Description
          </label>
          <textarea
            id="listing-description"
            rows={6}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('description')}
          />
          {errors.description ? (
            <p className="text-sm text-rose-300">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-slate-300">Photos</label>
          <p className="text-xs text-slate-500">
            At least 3 photos are required. Add them by uploading files or pasting image URLs. The
            first photo becomes the cover.
          </p>

          <div className={`rounded-2xl border px-4 py-2.5 text-sm ${totalPhotos >= 3 ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-slate-950/60 text-slate-400'}`}>
            {totalPhotos} of 3 photos added
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitted}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              <ImagePlus className="size-4" />
              Upload photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={handleFilesChange}
            />

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2.5">
                <LinkIcon className="size-4 shrink-0 text-slate-500" />
                <input
                  type="url"
                  placeholder="Paste an image URL"
                  value={urlInput}
                  disabled={submitted}
                  onChange={(event) => setUrlInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddUrl()
                    }
                  }}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={submitted || !urlInput.trim()}
                className="shrink-0 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {imageError ? (
            <p className="text-sm text-rose-300">{imageError}</p>
          ) : null}

          {existingImages.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Existing photos</p>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="Existing"
                    className="size-20 rounded-2xl border border-white/10 object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {pendingFiles.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Photos to upload ({pendingFiles.length})</p>
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="size-20 rounded-2xl border border-amber-400/30 object-cover"
                    />
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() =>
                        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-400 disabled:opacity-50"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {imageUrls.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">URL photos ({imageUrls.length})</p>
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((imageUrl, index) => (
                  <div key={imageUrl} className="relative">
                    <img
                      src={imageUrl}
                      alt={`URL photo ${index + 1}`}
                      className="size-20 rounded-2xl border border-sky-400/30 object-cover"
                    />
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-400 disabled:opacity-50"
                      aria-label={`Remove URL photo ${index + 1}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="listing-type">
            Listing type
          </label>
          <select
            id="listing-type"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('listingType')}
          >
            <option value="SALE">Sale</option>
            <option value="RENT">Rent</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="property-type">
            Property type
          </label>
          <select
            id="property-type"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('propertyType')}
          >
            <option value="CONDO">Condo</option>
            <option value="HOUSE">House</option>
            <option value="LAND">Land</option>
            <option value="APARTMENT">Apartment</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="listing-price">
            Price
          </label>
          <input
            id="listing-price"
            type="number"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price ? <p className="text-sm text-rose-300">{errors.price.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="listing-township">
            Township
          </label>
          <input
            id="listing-township"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('township')}
          />
          {errors.township ? (
            <p className="text-sm text-rose-300">{errors.township.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="listing-city">
            City
          </label>
          <input
            id="listing-city"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('city')}
          />
          {errors.city ? <p className="text-sm text-rose-300">{errors.city.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="listing-latitude">
            Latitude (optional)
          </label>
          <input
            id="listing-latitude"
            type="number"
            step="any"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('latitude', { valueAsNumber: true })}
          />
          {errors.latitude ? (
            <p className="text-sm text-rose-300">{errors.latitude.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="listing-longitude">
            Longitude (optional)
          </label>
          <input
            id="listing-longitude"
            type="number"
            step="any"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('longitude', { valueAsNumber: true })}
          />
          {errors.longitude ? (
            <p className="text-sm text-rose-300">{errors.longitude.message}</p>
          ) : null}
        </div>

        {mutation.isError ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">
            {(mutation.error as Error).message}
          </p>
        ) : null}

        {mutation.isSuccess ? (
          <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 md:col-span-2">
            {editing ? 'Listing updated successfully.' : 'Listing submitted for admin approval.'}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {editing ? 'Saving...' : 'Publishing...'}
              </>
            ) : editing ? (
              'Save changes'
            ) : (
              'Publish listing'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
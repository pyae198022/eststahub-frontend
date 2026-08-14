import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { createProperty, fetchProfile, fetchProperty, updateProperty } from '../lib/api'
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

export function CreateListingPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

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
    resolver: zodResolver(createListingSchema),
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

  const mutation = useMutation({
    mutationFn: async (values: CreateListingValues) => {
      if (!profileQuery.data?.id) {
        throw new Error('Login first so the backend can resolve the owner ID.')
      }

      const payload = {
        ...values,
        ownerId: profileQuery.data.id,
      }

      return editing && id ? updateProperty(Number(id), payload) : createProperty(payload)
    },
    onSuccess: async () => {
      if (!editing) {
        reset()
      }
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (profileQuery.data && profileQuery.data.role !== 'SELLER') {
    return <Navigate to="/" replace />
  }

  if (
    editing &&
    propertyQuery.isSuccess &&
    (!propertyQuery.data.ownerId || propertyQuery.data.ownerId !== profileQuery.data?.id)
  ) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Seller tools</p>
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
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
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
          <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 md:col-span-2">
            {editing ? 'Listing updated successfully.' : 'Listing submitted for admin approval.'}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
          >
            {mutation.isPending
              ? editing
                ? 'Saving...'
                : 'Publishing...'
              : editing
                ? 'Save changes'
                : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  )
}

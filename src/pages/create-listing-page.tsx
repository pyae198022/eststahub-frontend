import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'

import { createProperty, fetchProfile } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'

const createListingSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(20, 'Add a more useful description.'),
  propertyType: z.string().min(2, 'Property type is required.'),
  listingType: z.string().min(2, 'Listing type is required.'),
  price: z.number().positive('Price must be greater than zero.'),
  township: z.string().min(2, 'Township is required.'),
  city: z.string().min(2, 'City is required.'),
})

type CreateListingValues = z.infer<typeof createListingSchema>

export function CreateListingPage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
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
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CreateListingValues) => {
      if (!profileQuery.data?.id) {
        throw new Error('Login first so the backend can resolve the owner ID.')
      }

      return createProperty({
        ...values,
        ownerId: profileQuery.data.id,
      })
    },
    onSuccess: async () => {
      reset()
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Seller tools</p>
        <h1 className="text-4xl font-semibold text-white">Create a property listing</h1>
        <p className="text-slate-400">
          The backend requires `ownerId` in the property payload, so this form uses the current
          profile ID automatically.
        </p>
      </div>

      <form
        className="mt-8 grid gap-5 md:grid-cols-2"
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
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

        {createMutation.isError ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">
            {(createMutation.error as Error).message}
          </p>
        ) : null}

        {createMutation.isSuccess ? (
          <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 md:col-span-2">
            Listing created successfully.
          </p>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
          >
            {createMutation.isPending ? 'Publishing...' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  )
}

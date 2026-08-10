import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { register as registerUser } from '../lib/api'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name.'),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['BUYER', 'SELLER']),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'BUYER',
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/login')
    },
  })

  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Get started</p>
        <h1 className="text-4xl font-semibold text-white">Create your account</h1>
        <p className="text-slate-400">
          The backend supports `BUYER` and `SELLER` roles out of the box, so this screen maps
          directly to the Spring registration payload.
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit((values) => registerMutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('fullName')}
          />
          {errors.fullName ? (
            <p className="text-sm text-rose-300">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('email')}
          />
          {errors.email ? <p className="text-sm text-rose-300">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-rose-300">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="role">
            Account type
          </label>
          <select
            id="role"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('role')}
          >
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
          </select>
        </div>

        {registerMutation.isError ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Registration failed. The email may already exist or the backend may be unavailable.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
        >
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
          Sign in
        </Link>
      </p>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { login } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'

const loginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.email('Enter a valid email address.'),
  ),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setToken = useAuthStore((state) => state.setToken)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (token) => {
      setToken(token)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      navigate('/')
    },
  })

  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Welcome back</p>
        <h1 className="text-4xl font-semibold text-white">Login to EstateHub</h1>
        <p className="text-slate-400">
          The backend returns a raw JWT token, so this client stores it and uses the profile
          endpoint to hydrate the signed-in experience.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('email')}
          />
          {errors.email ? <p className="text-sm text-rose-300">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-rose-300">{errors.password.message}</p>
          ) : null}
        </div>

        {loginMutation.isError ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Login failed. Check the backend server, database, and credentials.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        New here?{' '}
        <Link to="/register" className="font-medium text-emerald-300 hover:text-emerald-200">
          Create an account
        </Link>
      </p>
    </div>
  )
}

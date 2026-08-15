import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, FolderOpen, Heart, Home, LogIn, Menu, MessageSquare, ShieldCheck, UserCircle2, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { fetchOwnerInterests, fetchPendingInterests, fetchPendingProperties, fetchProfile } from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { cn } from '../lib/utils'

const guestLinks = [
  { to: '/', label: 'Discover', icon: Home },
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserCircle2 },
]

export function AppShell() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const [mobileOpen, setMobileOpen] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    retry: false,
  })

  const isSeller = profileQuery.data?.role === 'SELLER'
  const isAdmin = profileQuery.data?.role === 'ADMIN'

  const pendingPropertiesQuery = useQuery({
    queryKey: ['admin-pending-properties'],
    queryFn: fetchPendingProperties,
    enabled: Boolean(token && isAdmin),
    refetchInterval: 30000,
  })

  const pendingInterestsQuery = useQuery({
    queryKey: ['admin-pending-interests'],
    queryFn: fetchPendingInterests,
    enabled: Boolean(token && isAdmin),
    refetchInterval: 30000,
  })

  const adminBadgeCount =
    (pendingPropertiesQuery.data?.length ?? 0) + (pendingInterestsQuery.data?.length ?? 0)

  const sellerInterestsQuery = useQuery({
    queryKey: ['seller-interests'],
    queryFn: () => fetchOwnerInterests(),
    enabled: Boolean(token && isSeller),
    refetchInterval: 30000,
  })

  const sellerBadgeCount = sellerInterestsQuery.data?.length ?? 0

  const links = !token
    ? guestLinks
    : [
        { to: '/', label: 'Discover', icon: Home },
        ...(!isAdmin ? [{ to: '/wishlist', label: 'Wishlist', icon: Heart }] : []),
        ...(isSeller ? [
          { to: '/my-listings', label: 'My Listings', icon: FolderOpen },
        ] : []),
        ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
        { to: '/chat', label: 'Chats', icon: MessageSquare },
        { to: '/profile', label: 'Profile', icon: UserCircle2 },
      ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="flex items-center gap-3 text-white group">
            <div className="rounded-2xl bg-amber-500/15 p-2 text-amber-300 ring-1 ring-amber-400/30 transition-all duration-300 group-hover:bg-amber-500/25 group-hover:ring-amber-400/50">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.28em] text-amber-300/80">
                EstateHub
              </div>
              <div className="text-sm text-slate-400">Find your dream home</div>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
                {to === '/admin' && adminBadgeCount > 0 ? (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {adminBadgeCount}
                  </span>
                ) : null}
                {to === '/my-listings' && sellerBadgeCount > 0 ? (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {sellerBadgeCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
            {token ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Logout
              </button>
            ) : null}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen ? (
          <nav className="md:hidden animate-fade-in border-t border-white/10 bg-slate-950/95 backdrop-blur-xl px-6 py-4 space-y-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
                {to === '/admin' && adminBadgeCount > 0 ? (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {adminBadgeCount}
                  </span>
                ) : null}
                {to === '/my-listings' && sellerBadgeCount > 0 ? (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {sellerBadgeCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
            {token ? (
              <button
                type="button"
                onClick={() => { logout(); setMobileOpen(false) }}
                className="w-full flex items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Logout
              </button>
            ) : null}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-slate-950/60">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-2 text-amber-300 ring-1 ring-amber-400/30">
                <Building2 className="size-4" />
              </div>
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300/60">
                EstateHub
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <NavLink to="/" className="transition hover:text-slate-300">Home</NavLink>
              <span className="text-slate-700">·</span>
              <NavLink to="/login" className="transition hover:text-slate-300">Login</NavLink>
              <span className="text-slate-700">·</span>
              <NavLink to="/register" className="transition hover:text-slate-300">Register</NavLink>
            </div>
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} EstateHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">404</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Page not found</h1>
      <p className="mt-4 text-slate-400">
        This route is not part of the current EstateHub frontend.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
      >
        Go home
      </Link>
    </div>
  )
}

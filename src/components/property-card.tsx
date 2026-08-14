import { Heart, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn, formatPrice } from '../lib/utils'
import type { PropertyListItem } from '../types/api'

interface PropertyCardProps {
  property: PropertyListItem
  onWishlistClick?: (propertyId: number) => void
  wishlisted?: boolean
}

export function PropertyCard({
  property,
  onWishlistClick,
  wishlisted = false,
}: PropertyCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-amber-500/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        {property.coverImageUrl ? (
          <img
            src={property.coverImageUrl}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-950/80 to-slate-900/60">
            <div className="rounded-2xl bg-white/5 p-4">
              <MapPin className="size-8 text-amber-300/50" />
            </div>
            <span className="text-sm text-slate-400">No image available</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

        {onWishlistClick ? (
          <button
            type="button"
            onClick={() => onWishlistClick(property.id)}
            className={cn(
              'absolute right-4 top-4 rounded-full border p-2.5 transition-all duration-200 hover:scale-110',
              wishlisted
                ? 'border-rose-400/40 bg-rose-500/20 text-rose-400'
                : 'border-white/20 bg-slate-950/75 text-white hover:border-rose-400/30 hover:bg-rose-500/10',
            )}
          >
            <Heart className={cn('size-4', wishlisted && 'fill-current')} />
          </button>
        ) : null}

        {/* Listing type badge */}
        <div className="absolute left-4 top-4 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur-sm border border-white/10">
          {property.listingType === 'SALE' ? 'For Sale' : property.listingType === 'RENT' ? 'For Rent' : property.listingType}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{property.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{property.township}, {property.city}</span>
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
            {property.status}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{property.propertyType}</p>
            <p className="text-xl font-bold text-white">{formatPrice(property.price)}</p>
          </div>

          <Link
            to={`/properties/${property.id}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-amber-200 hover:shadow-lg hover:shadow-amber-500/10"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}

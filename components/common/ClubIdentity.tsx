import Link from 'next/link'
import { cn } from '@/lib/utils'

type ClubIdentitySize = 'xs' | 'sm' | 'md' | 'lg'

interface ClubIdentityProps {
  name: string
  badgeUrl?: string | null
  href?: string
  size?: ClubIdentitySize
  className?: string
  textClassName?: string
  reverse?: boolean
}

const SIZE_CLASSES: Record<ClubIdentitySize, string> = {
  xs: 'h-4 w-4 text-[8px]',
  sm: 'h-5 w-5 text-[9px]',
  md: 'h-6 w-6 text-[10px]',
  lg: 'h-10 w-10 text-xs',
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export function ClubIdentity({
  name,
  badgeUrl,
  href,
  size = 'sm',
  className,
  textClassName,
  reverse = false,
}: ClubIdentityProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card',
          SIZE_CLASSES[size],
        )}
      >
        {badgeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badgeUrl}
            alt={`${name} badge`}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="font-semibold text-muted-foreground">{getInitials(name)}</span>
        )}
      </span>
      <span className={cn('truncate', textClassName)}>{name}</span>
    </>
  )

  const classes = cn(
    'inline-flex min-w-0 items-center gap-2',
    reverse && 'flex-row-reverse',
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return <span className={classes}>{content}</span>
}

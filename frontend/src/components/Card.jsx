import { cn } from '@/lib/utils'

export default function Card({ children, className = '' }) {
  return (
    <div className={cn(
      'bg-neutral-900 rounded-xl border border-neutral-800 p-6',
      'shadow-xl shadow-black/20',
      className
    )}>
      {children}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center">
      <BrandMark size={56} />
      <h1 className="text-3xl font-bold text-[var(--text)]">404</h1>
      <p className="text-[var(--text-muted)]">This page has wandered off the field.</p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}

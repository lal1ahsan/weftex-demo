import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/ui'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Card>
      <EmptyState
        icon={<Compass />}
        title="Page not found"
        body="The page you're looking for doesn't exist in this demo."
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        }
        className="py-20"
      />
    </Card>
  )
}

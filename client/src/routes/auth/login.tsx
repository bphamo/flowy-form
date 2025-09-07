import { createFileRoute, useLocation } from '@tanstack/react-router';

import { signIn } from '@/lib/auth-client';
import { Layers } from 'lucide-react';
import { Badge, Button, Card, Container } from 'react-bootstrap';

export const Route = createFileRoute('/auth/login')({
  component: Login,
});

function Login() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const redirectParam = urlParams.get('redirect');

  const handleGitHubLogin = () => {
    signIn.social({
      provider: 'github',
      callbackURL: window.location.origin + (redirectParam ?? '/dashboard'),
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <Layers size={32} className="text-primary me-2" />
              <h2 className="h4 mb-0 fw-bold" style={{ color: 'var(--bs-body-color)' }}>Flowy Form</h2>
            </div>
            <Badge bg="primary" className="px-3 py-2">
              Secure Authentication
            </Badge>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h4 fw-semibold mb-2" style={{ color: 'var(--bs-body-color)' }}>Welcome!</h1>
                <p className="text-muted mb-0">Sign in to your account</p>
              </div>

              <div className="d-grid gap-3">
                <Button
                  onClick={handleGitHubLogin}
                  variant="dark"
                  size="lg"
                  className="d-flex align-items-center justify-content-center"
                  style={{ minHeight: '48px' }}
                >
                  <img height="20" className="me-2" src="https://cdn.simpleicons.org/github?viewbox=auto" />
                  Continue with GitHub
                </Button>
              </div>

              <div className="text-center mt-4">
                <p className="text-muted small mb-0">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-decoration-none">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-decoration-none">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-muted small">Secure login powered by GitHub OAuth</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

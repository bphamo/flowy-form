import { createFileRoute } from '@tanstack/react-router';
import { Github, Layers } from 'lucide-react';
import { Badge, Button, Card, Container } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@tanstack/react-router';

function GitHubLogin() {
  const { login } = useAuth();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const redirectParam = urlParams.get('redirect');

  const handleGitHubLogin = () => {
    login(redirectParam || undefined);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #ebf4ff, #e0e7ff)' }}>
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <Layers size={32} className="text-primary me-2" />
              <h2 className="h4 mb-0 text-dark fw-bold">Flowable Forms</h2>
            </div>
            <Badge bg="primary" className="px-3 py-2">
              Secure Authentication
            </Badge>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h4 text-dark fw-semibold mb-2">Welcome back</h1>
                <p className="text-muted mb-0">
                  Sign in to your account using GitHub
                </p>
              </div>

              <div className="d-grid gap-3">
                <Button
                  onClick={handleGitHubLogin}
                  variant="dark"
                  size="lg"
                  className="d-flex align-items-center justify-content-center"
                  style={{ minHeight: '48px' }}
                >
                  <Github size={20} className="me-2" />
                  Continue with GitHub
                </Button>
              </div>

              <div className="text-center mt-4">
                <p className="text-muted small mb-0">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-decoration-none">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-decoration-none">Privacy Policy</a>
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-muted small">
              Secure login powered by GitHub OAuth
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export const Route = createFileRoute('/auth/login')({
  component: GitHubLogin,
});
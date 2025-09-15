import { Link } from '@tanstack/react-router';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
  name?: string;
  title?: string;
  description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <div className="d-flex flex-column gap-4">
          <div className="d-flex flex-column align-items-center gap-3">
            <Link to="/" className="d-flex flex-column align-items-center gap-2 fw-medium text-decoration-none">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                style={{ height: '36px', width: '36px' }}
              >
                <span className="fw-bold">FL</span>
              </div>
              <span className="visually-hidden">{title}</span>
            </Link>

            <div className="text-center">
              <h1 className="h4 fw-medium">{title}</h1>
              <p className="text-muted small text-center">{description}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

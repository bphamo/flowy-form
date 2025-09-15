import { Link } from '@tanstack/react-router';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  name?: string;
  title?: string;
  description?: string;
}>) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
      <div className="w-100 d-flex flex-column gap-4" style={{ maxWidth: '400px' }}>
        <Link to="/" className="d-flex align-items-center justify-content-center gap-2 fw-medium text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
            style={{ height: '36px', width: '36px' }}
          >
            <span className="fw-bold">FL</span>
          </div>
        </Link>

        <div className="d-flex flex-column gap-4">
          <div className="card shadow-sm">
            <div className="card-header text-center py-4">
              <h5 className="card-title fs-4 mb-2">{title}</h5>
              <p className="text-muted mb-0">{description}</p>
            </div>
            <div className="card-body p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

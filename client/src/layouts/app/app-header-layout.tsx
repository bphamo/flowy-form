import { signOut, useSession } from '@/lib/auth-client';
import { type BreadcrumbItem } from '@/types';
import { Link, useNavigate } from '@tanstack/react-router';
import { FileText, Home, Layers, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Breadcrumb, Container, Dropdown, Nav, Navbar } from 'react-bootstrap';

export default function AppHeaderLayout({
  children,
  breadcrumbs,
  hideHeader,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; hideHeader?: boolean }>) {
  const { data: session } = useSession();
  const user = session?.user;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/';
        },
      },
    });
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideHeader && (
        <Navbar expand="lg" className="shadow-sm border-bottom" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
          <Container fluid>
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center text-decoration-none">
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(to right, var(--bs-primary), var(--bs-info))',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.75rem',
                }}
              >
                <Layers size={20} color="#fff" />
              </div>
              <strong style={{ color: 'var(--bs-body-color)' }}>Flowy Form</strong>
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="navbar-nav" />

            <Navbar.Collapse id="navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard" style={{ color: 'var(--bs-nav-link-color)' }} className="d-flex align-items-center fw-medium">
                  <Home size={16} className="me-2" />
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/forms" style={{ color: 'var(--bs-nav-link-color)' }} className="d-flex align-items-center fw-medium">
                  <FileText size={16} className="me-2" />
                  Forms
                </Nav.Link>
              </Nav>

              <Nav className="d-flex align-items-center">
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="text-decoration-none border-0 d-flex align-items-center p-2" id="user-dropdown">
                    <div className="d-flex align-items-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle me-2"
                        style={{ width: 32, height: 32, backgroundColor: 'var(--bs-primary-bg-subtle)' }}
                      >
                        <User size={16} className="text-primary" />
                      </div>
                      <div className="d-none d-md-block text-start">
                        <div className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>{user?.name}</div>
                        <div className="text-muted small">{user?.email}</div>
                      </div>
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow border-0">
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{user?.name}</div>
                      <div className="text-muted small">{user?.email}</div>
                    </div>
                    <Dropdown.Item as={Link} to="/settings/profile" className="d-flex align-items-center py-2">
                      <User size={16} className="me-2 text-muted" />
                      Profile Settings
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/settings/appearance" className="d-flex align-items-center py-2">
                      <SettingsIcon size={16} className="me-2 text-muted" />
                      Preferences
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center py-2 text-danger">
                      <LogOut size={16} className="me-2" />
                      Sign Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      )}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-bottom" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
          <Container fluid className="pt-2">
            <Breadcrumb className="mb-0">
              <Breadcrumb.Item onClick={() => navigate({ to: '/dashboard' })} className="d-flex align-items-center text-decoration-none">
                <Home size={14} className="me-1" />
                Home
              </Breadcrumb.Item>
              {breadcrumbs.map((breadcrumb, index) => (
                <Breadcrumb.Item
                  key={index}
                  active={index === breadcrumbs.length - 1}
                  onClick={() => navigate({ to: breadcrumb.href })}
                  style={index === breadcrumbs.length - 1 ? { color: 'var(--bs-body-color)', fontWeight: 500 } : { color: 'var(--bs-secondary-color)' }}
                  className={index === breadcrumbs.length - 1 ? '' : 'text-decoration-none'}
                >
                  {breadcrumb.title}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </Container>
        </div>
      )}

      <main className="flex-fill" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
        {children}
      </main>
    </div>
  );
}

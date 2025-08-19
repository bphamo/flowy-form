import { type BreadcrumbItem } from '@/types';
import { Link, useNavigate } from '@tanstack/react-router';
import { FileText, Home, Layers, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Breadcrumb, Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';

export default function AppHeaderLayout({
  children,
  breadcrumbs,
  hideHeader,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; hideHeader?: boolean }>) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideHeader && (
        <Navbar expand="lg" className="shadow-sm border-bottom" style={{ backgroundColor: '#ffffff' }}>
          <Container fluid>
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center text-decoration-none">
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.75rem',
                }}
              >
                <Layers size={20} color="#fff" />
              </div>
              <strong className="text-dark">Flowable Forms</strong>
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="navbar-nav" />

            <Navbar.Collapse id="navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard" className="d-flex align-items-center text-muted fw-medium">
                  <Home size={16} className="me-2" />
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/forms" className="d-flex align-items-center text-muted fw-medium">
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
                        style={{ width: 32, height: 32, backgroundColor: '#dbeafe' }}
                      >
                        <User size={16} className="text-primary" />
                      </div>
                      <div className="d-none d-md-block text-start">
                        <div className="fw-semibold text-dark small">{user?.name}</div>
                        <div className="text-muted small">{user?.email}</div>
                      </div>
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow border-0">
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-semibold text-dark">{user?.name}</div>
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
        <div className="border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
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
                  className={index === breadcrumbs.length - 1 ? 'text-dark fw-medium' : 'text-decoration-none'}
                >
                  {breadcrumb.title}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </Container>
        </div>
      )}

      <main className="flex-fill" style={{ backgroundColor: '#ffffff' }}>
        {children}
      </main>
    </div>
  );
}
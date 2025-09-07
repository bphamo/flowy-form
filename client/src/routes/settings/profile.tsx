import { createFileRoute } from '@tanstack/react-router';
import { FormEvent, useState } from 'react';

import { LoadingSpinner } from '@/components/common/loading-spinner';
import { PageHeader } from '@/components/common/page-header';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { requireAuth } from '@/lib/auth-utils';
import { type BreadcrumbItem } from '@/types';
import { AlertTriangle, CheckCircle, Mail, Shield, Trash2, User } from 'lucide-react';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Profile settings',
    href: '/settings/profile',
  },
];

type ProfileForm = {
  name: string;
  email: string;
};

function SettingsProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileForm>({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      // TODO: Replace with actual API call
      console.log('Updating profile with data:', data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setRecentlySuccessful(true);
      setTimeout(() => setRecentlySuccessful(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile' });
    } finally {
      setProcessing(false);
    }
  };

  const mustVerifyEmail = false; // TODO: Get from user data
  const [status] = useState<string>(''); // TODO: Get from query params

  if (!user) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: User, text: 'Profile Settings' }}
            title="Manage Your Profile"
            description="Update your personal information and account preferences"
          />

          <SettingsLayout>
            <Row className="g-4">
              {/* Profile Information Card */}
              <Col lg={8}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                    <div className="d-flex align-items-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
                        style={{ width: 40, height: 40, backgroundColor: 'var(--bs-primary-bg-subtle)' }}
                      >
                        <User size={20} className="text-primary" />
                      </div>
                      <div>
                        <h5 className="mb-0 fw-bold">Profile Information</h5>
                        <p className="text-muted small mb-0">Update your name and email address</p>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="name" className="form-label fw-semibold">
                          Full Name
                        </label>
                        <div className="position-relative">
                          <input
                            id="name"
                            className={`form-control ps-5 ${errors.name ? 'is-invalid' : ''}`}
                            value={data.name}
                            onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                            required
                            autoComplete="name"
                            placeholder="Enter your full name"
                          />
                          <User size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="email" className="form-label fw-semibold">
                          Email Address
                        </label>
                        <div className="position-relative">
                          <input
                            id="email"
                            type="email"
                            className={`form-control ps-5 ${errors.email ? 'is-invalid' : ''}`}
                            value={data.email}
                            onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                            autoComplete="username"
                            placeholder={data.email ? 'Enter your email address' : 'No email available from GitHub'}
                            disabled={!user.email}
                          />
                          <Mail size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                          {!user.email && (
                            <div className="form-text text-muted">
                              <small>
                                Your GitHub account doesn't share an email address. You can update your GitHub privacy settings to make your email
                                available.
                              </small>
                            </div>
                          )}
                        </div>
                      </div>

                      {mustVerifyEmail && !user.emailVerified && (
                        <div className="alert alert-warning d-flex align-items-start mb-4">
                          <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
                          <div>
                            <p className="mb-2">
                              Your email address is unverified.{' '}
                              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold">
                                Click here to resend the verification email.
                              </button>
                            </p>
                            {status === 'verification-link-sent' && (
                              <div className="text-success fw-semibold d-flex align-items-center">
                                <CheckCircle size={16} className="me-1" />A new verification link has been sent to your email address.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="d-flex align-items-center gap-3">
                        <Button type="submit" disabled={processing} variant="primary" className="d-flex align-items-center">
                          {processing ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} className="me-2" />
                              Save Changes
                            </>
                          )}
                        </Button>

                        {recentlySuccessful && (
                          <div className="d-flex align-items-center text-success">
                            <CheckCircle size={16} className="me-1" />
                            <span className="small fw-semibold">Saved successfully</span>
                          </div>
                        )}
                      </div>
                    </form>
                  </Card.Body>
                </Card>
              </Col>

              {/* Account Status Card */}
              <Col lg={4}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                    <div className="d-flex align-items-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
                        style={{ width: 40, height: 40, backgroundColor: 'var(--bs-success-bg-subtle)' }}
                      >
                        <Shield size={20} className="text-success" />
                      </div>
                      <div>
                        <h5 className="mb-0 fw-bold">Account Status</h5>
                        <p className="text-muted small mb-0">Your account information</p>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted small">Email Status</span>
                        {user.emailVerified ? (
                          <Badge bg="success" className="d-flex align-items-center">
                            <CheckCircle size={12} className="me-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge bg="warning" className="d-flex align-items-center">
                            <AlertTriangle size={12} className="me-1" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted small">Member Since</span>
                        <span className="small">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Danger Zone */}
            <Card className="shadow-sm border-danger mt-4">
              <Card.Header className="bg-danger-subtle py-3">
                <div className="d-flex align-items-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
                    style={{ width: 40, height: 40, backgroundColor: 'var(--bs-danger-bg-subtle)' }}
                  >
                    <Trash2 size={20} className="text-danger" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-danger">Danger Zone</h5>
                    <p className="text-muted small mb-0">Irreversible actions that affect your account</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-semibold text-danger mb-1">Delete Account</h6>
                    <p className="text-muted small mb-0">This action cannot be undone. All data will be permanently removed.</p>
                  </div>
                  <Button variant="outline-danger" className="d-flex align-items-center">
                    <Trash2 size={18} className="me-2" />
                    Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </SettingsLayout>
        </Container>
      </div>
    </AppLayout>
  );
}

export const Route = createFileRoute('/settings/profile')({
  beforeLoad: ({ context }) => {
    requireAuth(context, '/settings/profile');
  },
  component: SettingsProfile,
});

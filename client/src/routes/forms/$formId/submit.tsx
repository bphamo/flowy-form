import { createFileRoute, Link, useLoaderData, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { IconCard } from '@/components/common/icon-card';
import { VersionShaDisplay } from '@/components/common/version-sha-display';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import type { FormSchema } from '@/types/api';
import { Form } from '@formio/react';
import { FileText, Info, Shield, User } from 'lucide-react';
import { Alert, Card, Container } from 'react-bootstrap';

export const Route = createFileRoute('/forms/$formId/submit')({
  loader: async ({ params, location }) => {
    try {
      const response = await api.forms.getSubmitSchema(parseInt(params.formId));
      const searchParams = new URLSearchParams(location.search);
      const isEmbedded = searchParams.get('embed') === 'true';
      const embedTheme = searchParams.get('theme');
      return { form: response.data, isEmbedded, embedTheme };
    } catch (error) {
      console.error('Error fetching form for submission:', error);
      throw error;
    }
  },
  staleTime: 0, // Always refetch
  gcTime: 0, // Don't cache
  component: FormsSubmit,
});

function FormsSubmit() {
  const { form, isEmbedded, embedTheme } = useLoaderData({ from: '/forms/$formId/submit' }) as {
    form: FormSchema;
    isEmbedded: boolean;
    embedTheme: string | null;
  };
  const { formId } = useParams({ from: '/forms/$formId/submit' });
  const navigate = useNavigate({ from: '/forms/$formId/submit' });
  const { data: session } = useSession();
  const user = session?.user;
  const [submitting, setSubmitting] = useState(false);
  const formSchema = useRef(form?.schema || { components: [] });
  const [submissionData, setSubmissionData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const actualFormId = form?.id || (formId ? parseInt(formId) : null);
  const isLoggedIn = !!user;
  const formData = form;

  // Apply embed theme if specified
  useEffect(() => {
    if (isEmbedded && embedTheme) {
      const validThemes: Appearance[] = ['light', 'dark', 'system'];
      const theme = validThemes.includes(embedTheme as Appearance) ? (embedTheme as Appearance) : 'system';

      // Apply theme directly for embedded forms using React Bootstrap data-bs-theme approach
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    }
  }, [isEmbedded, embedTheme]);

  const handleChange = (value: unknown, _flags: unknown, modified: boolean) => {
    if (modified && value && typeof value === 'object' && 'data' in value) {
      setSubmissionData((value as { data: Record<string, unknown> }).data);
    }
  };

  const handleSubmit = async () => {
    if (!actualFormId) {
      setError('Form ID is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting form data:', {
        formId: actualFormId,
        data: submissionData,
      });

      // Call the API endpoint to submit the form
      const versionSha = form.versionSha;
      if (!versionSha) {
        throw new Error('No version available for submission');
      }
      const response = await api.submissions.submitToForm(actualFormId, versionSha, submissionData);

      const submissionResult = response.data;
      console.log('Submission successful:', submissionResult);

      // Redirect to success page with submission ID and token (if anonymous)
      const successUrl = `/forms/${actualFormId}/success/${submissionResult.id}`;
      const urlWithToken = submissionResult.token
        ? `${successUrl}?token=${submissionResult.token}${isEmbedded ? '&embed=true' : ''}`
        : `${successUrl}${isEmbedded ? '?embed=true' : ''}`;

      navigate({ to: urlWithToken });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form not found - check if it's an access denied case for embedded forms
  if (!formData) {
    const errorContent = (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <h3>Form not found</h3>
          <p className="text-muted">The requested form could not be loaded.</p>
          {isEmbedded && (
            <div className="mt-3">
              <Alert variant="info" className="d-inline-block">
                <Info size={20} className="me-2" />
                Only public forms can be embedded on external websites.
              </Alert>
            </div>
          )}
        </div>
      </div>
    );

    if (isEmbedded) {
      return (
        <div className="container-fluid p-3" style={{ maxWidth: '600px' }}>
          {errorContent}
        </div>
      );
    }

    return <AppLayout hideHeader>{errorContent}</AppLayout>;
  }

  // Handle errors and access denied cases
  if (!actualFormId || error) {
    // Check if this is an access denied error for private forms
    const isAccessDenied = error && (error.includes('Access denied') || error.includes('Authentication required'));
    const isEmbedBlocked = error && error.includes('Embedding is only available for public forms');

    const errorContent = (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <h3>{isAccessDenied ? 'Form Not Available' : isEmbedBlocked ? 'Embedding Not Available' : error ? 'Error' : 'Form not found'}</h3>
          <p className="text-muted">
            {isEmbedBlocked
              ? 'This form cannot be embedded because it is not public.'
              : isAccessDenied && isEmbedded
                ? 'This form cannot be embedded because it is not public.'
                : error || 'The requested form could not be loaded.'}
          </p>
          {(isEmbedBlocked || (isAccessDenied && isEmbedded)) && (
            <div className="mt-3">
              <Alert variant="info" className="d-inline-block">
                <Info size={20} className="me-2" />
                Only public forms can be embedded on external websites.
              </Alert>
            </div>
          )}
        </div>
      </div>
    );

    if (isEmbedded) {
      return (
        <div className="container-fluid p-3" style={{ maxWidth: '600px' }}>
          {errorContent}
        </div>
      );
    }

    return <AppLayout hideHeader>{errorContent}</AppLayout>;
  }

  // Embedded layout - minimal styling, just the form
  if (isEmbedded) {
    return (
      <div className="container-fluid p-3" style={{ maxWidth: '600px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="d-flex align-items-start mb-3">
            <Info size={20} className="me-2 mt-1 flex-shrink-0" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </Alert>
        )}

        {/* Form Card - Minimal styling for embedding */}
        <Card className="border-0 shadow-sm">
          <Card.Header style={{ backgroundColor: 'var(--bs-secondary-bg)' }} className="border-bottom py-3">
            <div className="d-flex align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">{formData.name}</h5>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-3">
            {formData && formSchema.current && (
              <Form
                src={formSchema.current}
                onChange={handleChange}
                onSubmit={handleSubmit}
                options={{
                  noAlerts: true,
                  readOnly: submitting,
                }}
              />
            )}
            {submitting && (
              <div className="text-center mt-3">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span className="visually-hidden">Submitting...</span>
                </div>
                <span className="small">Submitting your response...</span>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Minimal security notice for embedded forms */}
        <div className="mt-3 p-2 bg-light rounded">
          <div className="d-flex align-items-start">
            <Shield size={16} className="text-success me-2 mt-1 flex-shrink-0" />
            <div className="small text-muted">
              {isLoggedIn ? ' Linked to your account.' : ' Anonymous submission - please do not enter sensitive information'}
            </div>
          </div>
        </div>
        {/* Powered by Flowy Forms */}
        <div className="text-center mt-3">
          <small className="text-muted small">
            Powered by{' '}
            <Link to="/" target="_blank" rel="noopener noreferrer">
              Flowy Forms
            </Link>
          </small>
        </div>
      </div>
    );
  }

  // Full layout for non-embedded forms
  return (
    <AppLayout hideHeader>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
          <div className="w-100">
            {/* Error Alert */}
            {error && (
              <Alert variant="danger" className="d-flex align-items-start mb-4">
                <Info size={20} className="me-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </Alert>
            )}

            {/* User Status Alert */}
            {isLoggedIn && (
              <Alert variant="success" className="d-flex align-items-start mb-4">
                <User size={20} className="me-2 mt-1 flex-shrink-0" />
                <div>
                  <strong>Authenticated Submission:</strong> Submitting as {user.name} ({user.email})
                </div>
              </Alert>
            )}

            {/* Form Card */}
            <Card className="shadow-sm border-0">
              <Card.Header className="py-4" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                <IconCard
                  icon={FileText}
                  iconColor="text-primary"
                  iconBg="var(--bs-primary-bg-subtle)"
                  title={formData.name}
                  description="Complete all required fields and submit your response"
                />
              </Card.Header>
              <Card.Body className="p-4">
                {formData && formSchema.current && (
                  <Form
                    src={formSchema.current}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    options={{
                      noAlerts: true,
                      readOnly: submitting,
                    }}
                  />
                )}
                {submitting && (
                  <div className="text-center mt-3">
                    <div className="spinner-border text-primary me-2" role="status">
                      <span className="visually-hidden">Submitting...</span>
                    </div>
                    <span>Submitting your response...</span>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Security Notice */}
            <Card className="shadow-sm border-0 mt-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle me-3 flex-shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: 'var(--bs-success-bg-subtle)' }}
                  >
                    <Shield size={20} className="text-success" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>Your Privacy & Security</h6>
                    <div className="text-muted small">
                      <ul className="mb-0 ps-3">
                        <li>We only collect the information you provide in this form</li>
                        <li>
                          {isLoggedIn
                            ? 'Your submission is linked to your account'
                            : 'Anonymous submission - please do not enter sensitive information'}
                        </li>
                        <li>You can contact us anytime if you have questions about your data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Version SHA Display */}
            {formData?.versionSha && (
              <div className="mt-4">
                <VersionShaDisplay versionSha={formData.versionSha} />
              </div>
            )}
          </div>
        </Container>
      </div>
    </AppLayout>
  );
}

import { createFileRoute, useLoaderData, useParams } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import { PageHeader } from '@/components/common/page-header';
import { VersionShaDisplay } from '@/components/common/version-sha-display';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import type { SubmissionDetail } from '@/types/api';
import { Form as FormioForm } from '@formio/react';
import { CheckCircle, Copy, Download, Info, Shield, User } from 'lucide-react';
import { Alert, Badge, Button, Card, Container } from 'react-bootstrap';

export const Route = createFileRoute('/forms/$formId/success/$submissionId')({
  loader: async ({ params, location }) => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token') || undefined;
      const isEmbedded = searchParams.get('embed') === 'true';

      const response = await api.submissions.get(parseInt(params.submissionId), token);

      return { submission: response.data, isEmbedded };
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  },
  staleTime: 0, // Always refetch
  gcTime: 0, // Don't cache
  component: FormsSuccess,
});

function FormsSuccess() {
  const { submission, isEmbedded } = useLoaderData({ from: '/forms/$formId/success/$submissionId' }) as {
    submission: SubmissionDetail;
    isEmbedded: boolean;
  };
  const { formId, submissionId } = useParams({ from: '/forms/$formId/success/$submissionId' });
  const formSchema = useRef(submission?.schema || { components: [] });
  const [copied, setCopied] = useState(false);

  const actualSubmissionId = submission?.id || (submissionId ? parseInt(submissionId) : null);
  const submissionDetails = submission;

  const submissionUrl = submission?.token
    ? `${window.location.origin}/forms/${formId}/success/${actualSubmissionId}?token=${submission.token}${isEmbedded ? '&embed=true' : ''}`
    : `${window.location.origin}/forms/${formId}/success/${actualSubmissionId}${isEmbedded ? '?embed=true' : ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(submissionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle submission not found
  if (!actualSubmissionId || !submissionDetails) {
    const errorContent = (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <h3>Submission not found</h3>
          <p className="text-muted">The requested submission could not be loaded.</p>
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

  // Embedded layout - minimal success message
  if (isEmbedded) {
    return (
      <div className="container-fluid p-3" style={{ maxWidth: '600px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Success message */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 64, height: 64, backgroundColor: 'var(--bs-success-bg-subtle)' }}
          >
            <CheckCircle size={32} className="text-success" />
          </div>
          <h4 className="fw-bold text-success mb-2">Submission Successful!</h4>
          <p className="text-muted">Your response has been recorded.</p>
        </div>

        {/* Submission details card */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-3">
            <div className="d-flex flex-column gap-3">
              {/* Submission info */}
              <div className="text-center">
                <div className="small text-muted mb-1">Submission ID</div>
                <Badge bg="light" text="dark" className="fw-bold">
                  #{submissionDetails.id}
                </Badge>
                <div className="small text-muted mt-1">for {submissionDetails.formName}</div>
              </div>

              {/* Submission link for anonymous submissions */}
              {submissionDetails.token && (
                <div>
                  <label className="form-label fw-semibold small">Access Link</label>
                  <div className="d-flex gap-2">
                    <input type="text" className="form-control form-control-sm" value={submissionUrl} readOnly />
                    <Button variant="outline-secondary" size="sm" onClick={copyToClipboard} className="d-flex align-items-center">
                      <Copy size={14} className="me-1" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="text-muted small mt-1">Save this link to access your submission later</div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-center">
                <div className="small text-muted">Submitted: {new Date(submissionDetails.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Security notice */}
        <div className="mt-3 p-2 bg-light rounded">
          <div className="d-flex align-items-start">
            <Shield size={16} className="text-success me-2 mt-1 flex-shrink-0" />
            <div className="small text-muted">
              Your submission is stored securely.
              {submissionDetails.token && " Keep your access link safe as it's the only way to view this submission."}
            </div>
          </div>
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
            <PageHeader badge={{ icon: CheckCircle, text: 'Submission Successful', variant: 'success' }} title="Thank You!" />

            {/* Status Alerts */}
            <div className="mt-4">
              <Alert variant="success" className="d-flex align-items-start">
                <CheckCircle size={20} className="me-2 flex-shrink-0" />
                <div>
                  <strong>Submission Confirmed:</strong> Your response for {submissionDetails.formName} has been successfully recorded and processed.
                </div>
              </Alert>

              {submissionDetails.isFormOwner && (
                <Alert variant="info" className="d-flex align-items-start">
                  <User size={20} className="me-2 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Form Owner Notice:</strong> This submission was made by {submissionDetails.submitterInformation?.name ?? 'Anonymous'} (
                    {submissionDetails.submitterInformation?.email ?? 'Anonymous'})
                  </div>
                </Alert>
              )}

              {submissionDetails.token && (
                <Alert variant="warning" className="d-flex align-items-start">
                  <Shield size={20} className="me-2 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Anonymous Submission:</strong> Keep your submission link safe as it's the only way to access this data later.
                  </div>
                </Alert>
              )}
            </div>

            <Card className="shadow-sm border-0">
              <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                <div className="d-flex align-items-center">
                  <span className="text-muted">Submission ID:</span>
                  <Badge bg="light" text="dark" className="fw-bold">
                    #{submissionDetails.id}
                  </Badge>
                  <span className="text-muted">for Form:</span>
                  <Badge bg="light" text="dark" className="fw-bold">
                    {submissionDetails.formName}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex flex-column gap-3">
                  {submissionDetails.token && (
                    <div>
                      <label className="form-label fw-semibold small">Submission Link</label>
                      <div className="d-flex gap-2">
                        <input type="text" className="form-control form-control-sm" value={submissionUrl} readOnly />
                        <Button variant="outline-secondary" size="sm" onClick={copyToClipboard} className="d-flex align-items-center">
                          <Copy size={14} className="me-1" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="text-muted small mt-1">Bookmark this link to access your submission later</div>
                    </div>
                  )}
                  {submissionDetails.submitterInformation && (
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Submitter</span>
                      <div className="text-end">
                        <div className="fw-semibold text-dark">{submissionDetails.submitterInformation.name}</div>
                        <div className="text-muted small">{submissionDetails.submitterInformation.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button variant="primary" className="d-flex align-items-center justify-content-center">
                      <Download size={18} className="me-2" />
                      Download Submission
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Submitted Data Preview */}
            <Card className="shadow-sm border-0 mt-4">
              <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                <h5 className="mb-0 fw-bold">Your Submission</h5>
              </Card.Header>
              <Card.Body className="p-4">
                {submissionDetails && (
                  <FormioForm src={formSchema.current} submission={{ data: submissionDetails.data }} options={{ readOnly: true }} />
                )}
              </Card.Body>
            </Card>
            <div className="d-flex justify-content-end align-items-center">
              <span className="text-muted">Created at: </span>
              <span className="text-dark">{new Date(submissionDetails.createdAt).toLocaleString()}</span>
            </div>

            {/* Version SHA Display */}
            {submission?.versionSha && (
              <div className="mt-4">
                <VersionShaDisplay versionSha={submission.versionSha} />
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-5">
              <p className="text-muted">Thank you for using Flowy Form. If you have any questions, please contact support.</p>
            </div>
          </div>
        </Container>
      </div>
    </AppLayout>
  );
}

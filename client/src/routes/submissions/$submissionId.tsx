import { createFileRoute, Link, useLoaderData, useRouter } from '@tanstack/react-router';

import { PageHeader } from '@/components/common/page-header';
import { SubmissionStatusBadge } from '@/components/common/submission-status-badge';
import { SubmissionStatusDropdown } from '@/components/common/submission-status-dropdown';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth-utils';
import { type BreadcrumbItem } from '@/types';
import type { SubmissionDetail } from '@/types/api';
import type { SubmissionStatus } from '@/components/common/submission-status-badge';
import { ArrowLeft, Calendar, FileText, User, Users } from 'lucide-react';
import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, Toast, ToastContainer } from 'react-bootstrap';

export const Route = createFileRoute('/submissions/$submissionId')({
  beforeLoad: ({ context }) => {
    requireAuth(context, window.location.pathname);
  },
  loader: async ({ params }) => {
    try {
      const submissionId = parseInt(params.submissionId);
      const submissionResponse = await api.submissions.get(submissionId);
      return {
        submission: submissionResponse.data,
      };
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  },
  staleTime: 0, // Always refetch
  gcTime: 0, // Don't cache
  component: SubmissionDetail,
});

function SubmissionDetail() {
  const { submission: initialSubmission } = useLoaderData({ from: '/submissions/$submissionId' }) as {
    submission: SubmissionDetail;
  };
  const router = useRouter();
  
  const [submission, setSubmission] = useState<SubmissionDetail>(initialSubmission);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');

  const handleStatusChange = async (newStatus: SubmissionStatus) => {
    try {
      const response = await api.submissions.updateStatus(submission.id, { status: newStatus });
      
      setSubmission(prev => ({
        ...prev,
        status: response.data.status,
      }));
      
      setToastMessage(`Status updated to ${newStatus.toLowerCase().replace('_', ' ')}`);
      setToastVariant('success');
      setShowToast(true);

      // Refresh the page data to ensure consistency
      router.invalidate();
    } catch (error) {
      console.error('Error updating submission status:', error);
      setToastMessage('Failed to update submission status');
      setToastVariant('danger');
      setShowToast(true);
    }
  };

  if (!submission) {
    return (
      <AppLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <h3>Submission not found</h3>
            <p className="text-muted">The requested submission could not be loaded.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'All Submissions',
      href: '/submissions',
    },
    {
      title: submission.formName || 'Unknown Form',
      href: `/forms/${submission.formId}/submissions`,
    },
    {
      title: `Submission #${submission.id}`,
      href: `/submissions/${submission.id}`,
    },
  ];

  const isAnonymous = !submission.submitterInformation;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #ebf4ff, #e0e7ff)' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: FileText, text: 'Submission Details' }}
            title={`Submission #${submission.id}`}
            description={`Detailed view of submission for "${submission.formName}"`}
          />

          {/* Back Button */}
          <div className="mb-4">
            <div className="d-flex gap-2">
              <Link to="/submissions" className="text-decoration-none">
                <Button variant="outline-secondary" className="d-flex align-items-center">
                  <ArrowLeft size={16} className="me-2" />
                  All Submissions
                </Button>
              </Link>
              <Link to="/forms/$formId/submissions" params={{ formId: submission.formId.toString() }} className="text-decoration-none">
                <Button variant="outline-primary" className="d-flex align-items-center">
                  Form Submissions
                </Button>
              </Link>
            </div>
          </div>

          <Row className="g-4">
            {/* Submission Info */}
            <Col lg={4}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3">
                  <h5 className="mb-0 fw-bold">Submission Information</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <div className="fw-semibold text-dark small">Submission ID</div>
                      <Badge bg="light" text="dark" className="fw-bold">
                        #{submission.id}
                      </Badge>
                    </div>

                    <div>
                      <div className="fw-semibold text-dark small">Form</div>
                      <div className="text-dark">{submission.formName || 'Unknown Form'}</div>
                    </div>

                    <div>
                      <div className="fw-semibold text-dark small">Submitted</div>
                      <div className="d-flex align-items-center text-muted">
                        <Calendar size={14} className="me-1" />
                        {new Date(submission.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="fw-semibold text-dark small">Status</div>
                      {submission.isFormOwner ? (
                        <SubmissionStatusDropdown
                          currentStatus={submission.status}
                          onStatusChange={handleStatusChange}
                          size="normal"
                        />
                      ) : (
                        <SubmissionStatusBadge status={submission.status} size="normal" />
                      )}
                    </div>

                    {submission.version && (
                      <div>
                        <div className="fw-semibold text-dark small">Form Version</div>
                        <div className="text-dark">
                          <Badge bg="secondary" className="me-2">
                            {submission.version.sha.substring(0, 8)}
                          </Badge>
                          {submission.version.description && <small className="text-muted">{submission.version.description}</small>}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="fw-semibold text-dark small">Submission Type</div>
                      <Badge bg={isAnonymous ? 'warning' : 'success'} className="d-flex align-items-center w-fit">
                        {isAnonymous ? <User size={14} className="me-1" /> : <Users size={14} className="me-1" />}
                        {isAnonymous ? 'Anonymous' : 'Authenticated'}
                      </Badge>
                    </div>

                    {submission.submitterInformation && (
                      <div>
                        <div className="fw-semibold text-dark small">Submitter</div>
                        <div className="text-dark">
                          <div>{submission.submitterInformation.name}</div>
                          {submission.submitterInformation.email && <div className="text-muted small">{submission.submitterInformation.email}</div>}
                        </div>
                      </div>
                    )}

                    {submission.token && (
                      <div>
                        <Alert variant="info" className="mb-0">
                          <small>
                            <strong>Anonymous Access Token:</strong> This submission can be accessed anonymously using a secure token.
                          </small>
                        </Alert>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Submission Data */}
            <Col lg={8}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3">
                  <h5 className="mb-0 fw-bold">Submitted Data</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {submission.data ? (
                    <div>
                      {/* If we have Form.io component available, we can render the form with submitted data */}
                      {submission.schema ? (
                        <div>
                          <Alert variant="info" className="mb-3">
                            <small>
                              The form data is displayed below in a structured format. The form was rendered using the schema version at the time of
                              submission.
                            </small>
                          </Alert>
                          {/* This would be rendered with FormioForm component if available */}
                          <div className="bg-light p-3 rounded">
                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                              {JSON.stringify(submission.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Alert variant="warning" className="mb-3">
                            <small>Form schema not available. Displaying raw submission data.</small>
                          </Alert>
                          <div className="bg-light p-3 rounded">
                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                              {JSON.stringify(submission.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">No Data Available</h5>
                      <p className="text-muted">This submission does not contain any data.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Additional Actions */}
              <Card className="shadow-sm border-0 mt-4">
                <Card.Header className="bg-white py-3">
                  <h5 className="mb-0 fw-bold">Actions</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex gap-3">
                    <Button variant="outline-primary" className="d-flex align-items-center">
                      <FileText size={16} className="me-2" />
                      Export Data
                    </Button>

                    <Link to="/forms/$formId/manage" params={{ formId: submission.formId.toString() }} className="text-decoration-none">
                      <Button variant="outline-secondary" className="d-flex align-items-center">
                        Manage Form
                      </Button>
                    </Link>

                    {submission.isFormOwner && (
                      <Button variant="outline-danger" className="d-flex align-items-center">
                        Delete Submission
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* Toast notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          bg={toastVariant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </AppLayout>
  );
}

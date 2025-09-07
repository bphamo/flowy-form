import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router';

import { PageHeader } from '@/components/common/page-header';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type { FormWithCreator, SubmissionSummary } from '@/types/api';
import { ArrowLeft, Calendar, FileText, User, Users } from 'lucide-react';
import { Badge, Button, Card, Col, Container, Row, Table } from 'react-bootstrap';
import { requireAuth } from '@/lib/auth-utils';

export const Route = createFileRoute('/forms/$formId/submissions')({
  beforeLoad: ({ context }) => {
    requireAuth(context, window.location.pathname);
  },
  loader: async ({ params }) => {
    try {
      const formId = parseInt(params.formId);
      const [formResponse, submissionsResponse] = await Promise.all([api.forms.get(formId), api.submissions.getByForm(formId)]);
      return {
        form: formResponse.data,
        submissions: submissionsResponse.data,
      };
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      throw error;
    }
  },
  staleTime: 0, // Always refetch
  gcTime: 0, // Don't cache
  component: FormSubmissions,
});

function FormSubmissions() {
  const { form, submissions } = useLoaderData({ from: '/forms/$formId/submissions' }) as {
    form: FormWithCreator;
    submissions: SubmissionSummary[];
  };

  if (!form) {
    return (
      <AppLayout>
        <div>Form not found</div>
      </AppLayout>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'All Submissions',
      href: '/submissions',
    },
    {
      title: form.name,
      href: `/forms/${form.id}/submissions`,
    },
  ];

  // Sort submissions by creation date (newest first)
  const sortedSubmissions = [...submissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate stats
  const totalSubmissions = submissions.length;
  const anonymousSubmissions = submissions.filter((s) => s.isAnonymous).length;
  const authenticatedSubmissions = submissions.filter((s) => !s.isAnonymous).length;
  const recentSubmissions = submissions.filter((s) => new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #ebf4ff, #e0e7ff)' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: FileText, text: 'Form Submissions' }}
            title={`Submissions for "${form.name}"`}
            description="View and manage all submissions for this form."
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
              <Link to="/forms/$formId/manage" params={{ formId: form.id.toString() }} className="text-decoration-none">
                <Button variant="outline-primary" className="d-flex align-items-center">
                  Manage Form
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <Row className="g-4 mb-5">
            <Col md={3}>
              <Card className="shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 48, height: 48, backgroundColor: '#dbeafe' }}
                  >
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                    {totalSubmissions}
                  </div>
                  <div className="text-muted small">Total Submissions</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 48, height: 48, backgroundColor: '#dcfce7' }}
                  >
                    <Users size={20} className="text-success" />
                  </div>
                  <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                    {authenticatedSubmissions}
                  </div>
                  <div className="text-muted small">Authenticated</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 48, height: 48, backgroundColor: '#fef3c7' }}
                  >
                    <User size={20} className="text-warning" />
                  </div>
                  <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                    {anonymousSubmissions}
                  </div>
                  <div className="text-muted small">Anonymous</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0">
                <Card.Body className="text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 48, height: 48, backgroundColor: '#ede9fe' }}
                  >
                    <Calendar size={20} className="text-purple" />
                  </div>
                  <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                    {recentSubmissions}
                  </div>
                  <div className="text-muted small">This Week</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Submissions Table */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">All Submissions</h5>
                <Badge bg="light" text="dark" className="fs-6">
                  {totalSubmissions} total
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {sortedSubmissions.length > 0 ? (
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 px-4">ID</th>
                      <th className="border-0 py-3 px-4">Submitter</th>
                      <th className="border-0 py-3 px-4">Type</th>
                      <th className="border-0 py-3 px-4">Submitted</th>
                      <th className="border-0 py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="py-3 px-4">
                          <Badge bg="light" text="dark" className="fw-semibold">
                            #{submission.id}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {submission.submitterInformation ? (
                            <div>
                              <div className="fw-semibold text-dark">{submission.submitterInformation.name}</div>
                              {submission.submitterInformation.email && (
                                <div className="text-muted small">{submission.submitterInformation.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">Anonymous</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge bg={submission.isAnonymous ? 'warning' : 'success'}>{submission.isAnonymous ? 'Anonymous' : 'Authenticated'}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center text-muted small">
                            <Calendar size={14} className="me-1" />
                            {new Date(submission.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link to="/submissions/$submissionId" params={{ submissionId: submission.id.toString() }} className="text-decoration-none">
                            <Button variant="outline-primary" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <FileText size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No Submissions Yet</h5>
                  <p className="text-muted mb-4">This form hasn't received any submissions yet. Share your form to start collecting responses.</p>
                  <Link to="/forms/$formId/submit" params={{ formId: form.id.toString() }} className="text-decoration-none">
                    <Button variant="primary">Preview Form</Button>
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </AppLayout>
  );
}

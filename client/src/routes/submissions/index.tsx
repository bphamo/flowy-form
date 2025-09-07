import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router';

import { PageHeader } from '@/components/common/page-header';
import { SubmissionStatusBadge } from '@/components/common/submission-status-badge';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth-utils';
import { type BreadcrumbItem } from '@/types';
import type { UserSubmission } from '@/types/api';
import { Calendar, FileText } from 'lucide-react';
import { Button, Card, Container, Table } from 'react-bootstrap';

export const Route = createFileRoute('/submissions/')({
  beforeLoad: ({ context }) => {
    requireAuth(context, window.location.pathname);
  },
  loader: async () => {
    try {
      // Get submissions made by the current user
      const userSubmissionsResponse = await api.submissions.getByUser();
      const userSubmissions = userSubmissionsResponse.data;

      return { userSubmissions };
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
  },
  staleTime: 0, // Always refetch
  gcTime: 0, // Don't cache
  component: Submissions,
});

function Submissions() {
  const { userSubmissions } = useLoaderData({ from: '/submissions/' }) as {
    userSubmissions: UserSubmission[];
  };

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'My Submissions',
      href: '/submissions',
    },
  ];

  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #ebf4ff, #e0e7ff)' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: FileText, text: 'My Submissions' }}
            title="My Submissions"
            description="View all the submissions you have made to forms."
          />

          {/* Submissions Table */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">All My Submissions</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {userSubmissions.length > 0 ? (
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 px-4">Form Name</th>
                      <th className="border-0 py-3 px-4">Submission ID</th>
                      <th className="border-0 py-3 px-4">Status</th>
                      <th className="border-0 py-3 px-4">Submitted At</th>
                      <th className="border-0 py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="py-3 px-4">
                          <div>
                            <div className="fw-semibold text-dark">{submission.formName}</div>
                            {submission.formDescription && <div className="text-muted small">{submission.formDescription}</div>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <small className="text-muted">#{submission.id}</small>
                        </td>
                        <td className="py-3 px-4">
                          <SubmissionStatusBadge status={submission.status} size="small" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center text-muted">
                            <Calendar size={16} className="me-2" />
                            {formatDate(submission.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link to="/submissions/$submissionId" params={{ submissionId: submission.id.toString() }} className="text-decoration-none">
                            <Button variant="outline-primary" size="sm">
                              View Submission
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
                  <h5 className="text-muted">No Submissions Found</h5>
                  <p className="text-muted mb-4">You haven't submitted any forms yet.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </AppLayout>
  );
}

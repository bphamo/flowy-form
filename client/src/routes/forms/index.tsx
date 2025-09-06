import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router';

import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth-utils';
import { type BreadcrumbItem } from '@/types';
import type { FormSummary } from '@/types/api';
import { Calendar, FileText, MoreVertical, Plus, Settings } from 'lucide-react';
import { Badge, Button, Card, Col, Container, Dropdown, Row, Table } from 'react-bootstrap';

export const Route = createFileRoute('/forms/')({
  beforeLoad: ({ context }) => {
    requireAuth(context, '/forms');
  },
  loader: async () => {
    try {
      const response = await api.forms.list();
      return { forms: response.data };
    } catch (error) {
      console.error('Error fetching forms:', error);
      return { forms: [] };
    }
  },
  staleTime: 0, // Always refetch
  gcTime: 0, // Don't cache
  component: FormsIndex,
});

function FormsIndex() {
  const { forms } = useLoaderData({ from: '/forms/' }) as { forms: FormSummary[] };

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Manage Forms',
      href: '/forms',
    },
  ];

  // Sort forms by updated_at and get the 4 most recent
  const recentForms = [...forms].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: FileText, text: 'Form Management' }}
            title="Your Forms"
            description="Create, edit, and manage all your forms from one central location. Track submissions and monitor performance."
          />

          {/* Action Bar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 fw-semibold text-dark">All Forms ({forms.length})</h4>
            </div>
            <Link to="/forms/create" className="text-decoration-none">
              <Button variant="primary" className="d-flex align-items-center">
                <Plus size={18} className="me-2" />
                Create New Form
              </Button>
            </Link>
          </div>

          {forms.length === 0 ? (
            <Card className="shadow-sm border-0 text-center py-5">
              <Card.Body>
                <div className="text-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                    style={{ width: 80, height: 80, backgroundColor: 'var(--bs-gray-100)' }}
                  >
                    <FileText size={32} className="text-muted" />
                  </div>
                  <h3 className="fw-bold text-dark mb-3">No Forms Yet</h3>
                  <p className="text-muted mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    Create your first form to get started with collecting submissions and managing your data.
                  </p>
                  <Link to="/forms/create" className="text-decoration-none">
                    <Button variant="primary" size="lg" className="d-flex align-items-center mx-auto">
                      <Plus size={20} className="me-2" />
                      Create Your First Form
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <>
              {/* Recent Forms Section */}
              {recentForms.length > 0 && (
                <div className="mb-5">
                  <h5 className="fw-bold text-dark mb-3">Recently Updated</h5>
                  <Row className="g-4">
                    {recentForms.map((form) => (
                      <Col md={6} lg={3} key={form.id}>
                        <Card className="h-100 shadow-sm border-0 hover-shadow">
                          <Card.Body className="p-3">
                            <div className="d-flex align-items-start justify-content-between mb-3">
                              <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: 40, height: 40, backgroundColor: 'var(--bs-primary-bg-subtle)' }}
                              >
                                <FileText size={16} className="text-primary" />
                              </div>
                              <StatusBadge isPublic={form.isPublic} size="small" />
                            </div>

                            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.9rem' }}>
                              {form.name}
                            </h6>
                            <p className="text-muted small mb-2" style={{ height: '2.5rem', overflow: 'hidden' }}>
                              {form.description || 'No description'}
                            </p>

                            <div className="d-flex align-items-center text-muted small mb-3">
                              <Calendar size={12} className="me-1" />
                              Updated {new Date(form.updatedAt).toLocaleDateString()}
                            </div>

                            <div className="d-flex gap-2">
                              <Link to="/forms/$formId/manage" params={{ formId: form.id.toString() }} className="flex-fill text-decoration-none">
                                <Button variant="outline-primary" size="sm" className="w-100 d-flex align-items-center justify-content-center">
                                  <Settings size={14} className="me-1" />
                                  Manage
                                </Button>
                              </Link>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* All Forms Table */}
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">All Forms</h5>
                    <Badge bg="light" text="dark">
                      {forms.length} total
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4 py-3">Form</th>
                        <th className="py-3">Status</th>
                        <th className="py-3">Created</th>
                        <th className="py-3">Updated</th>
                        <th className="py-3 text-end pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((form, index) => (
                        <tr key={form.id} className={index % 2 === 0 ? 'table-light' : ''}>
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center">
                              <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
                                style={{ width: 32, height: 32, backgroundColor: 'var(--bs-primary-bg-subtle)' }}
                              >
                                <FileText size={14} className="text-primary" />
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{form.name}</div>
                                <div
                                  className="text-muted small"
                                  style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                  {form.description || 'No description'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <StatusBadge isPublic={form.isPublic} />
                          </td>
                          <td className="py-3">
                            <div className="text-muted small">{new Date(form.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-muted small">{new Date(form.updatedAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 text-end pe-4">
                            <div className="d-flex gap-2 justify-content-end">
                              <Link to="/forms/$formId/manage" params={{ formId: form.id.toString() }} className="text-decoration-none">
                                <Button variant="primary" size="sm" className="d-flex align-items-center">
                                  <Settings size={14} className="me-2" />
                                  Manage
                                </Button>
                              </Link>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm" className="border-0 d-flex align-items-center">
                                  <MoreVertical size={14} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="z-1000">
                                  <Dropdown.Item>
                                    <Link
                                      to="/forms/$formId/submit"
                                      params={{ formId: form.id.toString() }}
                                      className="text-decoration-none d-flex align-items-center"
                                    >
                                      <FileText size={14} className="me-2" />
                                      Submit
                                    </Link>
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Item className="text-danger">Delete Form</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}

          {/* Stats Section */}
          {forms.length > 0 && (
            <Card className="shadow-sm border-0 mt-5">
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0 fw-bold">Quick Stats</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-4">
                  <Col md={3}>
                    <div className="text-center">
                      <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                        {forms.length}
                      </div>
                      <div className="text-muted small">Total Forms</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                        {forms.filter((f) => f.isPublic).length}
                      </div>
                      <div className="text-muted small">Public Forms</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                        {forms.filter((f) => !f.isPublic).length}
                      </div>
                      <div className="text-muted small">Private Forms</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.5rem' }}>
                        {forms.filter((f) => new Date(f.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                      </div>
                      <div className="text-muted small">Created This Week</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>
    </AppLayout>
  );
}

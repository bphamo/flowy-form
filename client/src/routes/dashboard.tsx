import { createFileRoute, Link } from '@tanstack/react-router';

import { PageHeader } from '@/components/common/page-header';
import AppLayout from '@/layouts/app-layout';
import { requireAuth } from '@/lib/auth-utils';
import { type BreadcrumbItem } from '@/types';
import { BarChart3, Clock, FileText, GitBranch, TrendingUp, Users } from 'lucide-react';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    requireAuth(context, '/dashboard');
  },
  loader: async () => {
    try {
      // Fetch dashboard data from API
      const response = await fetch('/api/dashboard', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return { dashboardData: data.data || data };
      } else {
        // Return default data if API not available
        return {
          dashboardData: {
            totalForms: 12,
            totalSubmissions: 847,
            activeBranches: 5,
            recentActivity: [
              {
                icon: 'FileText',
                title: 'New form "Contact Us" created',
                time: '2 hours ago',
              },
              {
                icon: 'Users',
                title: '15 new submissions received',
                time: '4 hours ago',
              },
              {
                icon: 'GitBranch',
                title: 'Branch "feature/validation" merged',
                time: '1 day ago',
              },
            ],
          },
        };
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        dashboardData: {
          totalForms: 0,
          totalSubmissions: 0,
          activeBranches: 0,
          recentActivity: [],
        },
      };
    }
  },
  component: Dashboard,
});

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

function Dashboard() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: TrendingUp, text: 'Dashboard Overview' }}
            title="Welcome to Your Dashboard"
            description="Manage your forms, track submissions, and monitor your form performance from one central location."
          />

          {/* Stats Cards */}
          <Row className="g-4 mb-5">
            {[
              {
                icon: <FileText size={32} className="text-primary mb-3" />,
                title: 'Total Forms',
                value: '12',
                change: '+2 this week',
                bg: 'var(--bs-primary-bg-subtle)',
              },
              {
                icon: <Users size={32} className="text-success mb-3" />,
                title: 'Total Submissions',
                value: '847',
                change: '+134 this week',
                bg: 'var(--bs-success-bg-subtle)',
              },
              {
                icon: <GitBranch size={32} className="text-warning mb-3" />,
                title: 'Active Branches',
                value: '5',
                change: '+1 this week',
                bg: 'var(--bs-warning-bg-subtle)',
              },
            ].map((stat, idx) => (
              <Col md={4} key={idx}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="text-center p-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ width: 60, height: 60, backgroundColor: stat.bg }}
                    >
                      {stat.icon}
                    </div>
                    <h3 className="fw-bold text-dark mb-1">{stat.value}</h3>
                    <p className="text-muted mb-2">{stat.title}</p>
                    <Badge bg="light" text="dark" className="text-success">
                      {stat.change}
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Recent Activity & Quick Actions */}
          <Row className="g-4 mb-5">
            <Col lg={8}>
              <Card className="shadow-sm border-0">
                <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Recent Activity</h5>
                    <Button variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {[
                    {
                      icon: <FileText size={20} className="text-primary" />,
                      title: 'New form "Contact Us" created',
                      time: '2 hours ago',
                    },
                    {
                      icon: <Users size={20} className="text-success" />,
                      title: '15 new submissions received',
                      time: '4 hours ago',
                    },
                    {
                      icon: <GitBranch size={20} className="text-warning" />,
                      title: 'Branch "feature/validation" merged',
                      time: '1 day ago',
                    },
                  ].map((activity, idx) => (
                    <div key={idx} className="d-flex align-items-center p-3 mb-2 rounded" style={{ backgroundColor: 'var(--bs-gray-100)' }}>
                      <div className="me-3">{activity.icon}</div>
                      <div className="flex-grow-1">
                        <div className="fw-medium text-dark">{activity.title}</div>
                        <div className="text-muted small d-flex align-items-center">
                          <Clock size={14} className="me-1" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm border-0">
                <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                  <h5 className="mb-0 fw-bold">Quick Actions</h5>
                </Card.Header>
                <Card.Body className="d-flex flex-column gap-3">
                  <Link to="/forms/create" className="text-decoration-none">
                    <Button variant="primary" className="w-100 d-flex align-items-center">
                      <FileText size={18} className="me-2" />
                      Create New Form
                    </Button>
                  </Link>
                  <Link to="/forms" className="text-decoration-none">
                    <Button variant="outline-primary" className="w-100 d-flex align-items-center">
                      <BarChart3 size={18} className="me-2" />
                      View All Forms
                    </Button>
                  </Link>
                  <Link to="/submissions" className="text-decoration-none">
                    <Button variant="outline-secondary" className="w-100 d-flex align-items-center">
                      <Users size={18} className="me-2" />
                      Manage Submissions
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Performance Chart Placeholder */}
          <Card className="shadow-sm border-0">
            <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
              <h5 className="mb-0 fw-bold">Form Performance</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ minHeight: '300px', backgroundColor: 'var(--bs-gray-100)' }}>
                <div className="text-center">
                  <BarChart3 size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Performance Charts</h5>
                  <p className="text-muted mb-0">Analytics and performance metrics will be displayed here</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </AppLayout>
  );
}

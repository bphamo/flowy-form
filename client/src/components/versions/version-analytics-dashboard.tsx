import { BarChart3, Clock, Eye, GitCommit, TrendingUp, Users } from 'lucide-react';
import { Badge, Card, Col, ProgressBar, Row } from 'react-bootstrap';
import { FormVersion } from '../../types/api';

interface VersionAnalyticsDashboardProps {
  versions: FormVersion[];
  submissionStats?: {
    totalSubmissions: number;
    versionBreakdown: Array<{
      versionSha: string;
      submissionCount: number;
      conversionRate?: number;
    }>;
  };
}

/**
 * Version analytics dashboard showing metrics and performance comparison.
 * Displays submission counts, conversion rates, and A/B testing insights.
 * Implements Phase 4 version analytics requirements.
 */
export const VersionAnalyticsDashboard = ({ versions, submissionStats }: VersionAnalyticsDashboardProps) => {
  // Calculate version metrics
  const totalVersions = versions.length;
  const publishedVersions = versions.filter((v) => v.isPublished).length;
  const draftVersions = versions.filter((v) => !v.isPublished).length;
  const liveVersion = versions.find((v) => v.isPublished);

  // Calculate version ages
  const getVersionAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  // Get top performing versions by submissions
  const topVersions = submissionStats?.versionBreakdown?.sort((a, b) => b.submissionCount - a.submissionCount).slice(0, 5) || [];

  return (
    <div>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex align-items-center">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
              style={{ width: 40, height: 40, backgroundColor: 'var(--bs-primary-bg-subtle)' }}
            >
              <BarChart3 size={20} className="text-primary" />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Version Analytics</h5>
              <p className="text-muted small mb-0">Performance insights and submission metrics across versions</p>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Overview Stats */}
          <Row className="g-4 mb-4">
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <GitCommit size={24} className="text-primary mb-2" />
                <div className="fw-bold text-dark h4 mb-1">{totalVersions}</div>
                <div className="small text-muted">Total Versions</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <Eye size={24} className="text-success mb-2" />
                <div className="fw-bold text-dark h4 mb-1">{publishedVersions}</div>
                <div className="small text-muted">Published</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <Users size={24} className="text-info mb-2" />
                <div className="fw-bold text-dark h4 mb-1">{submissionStats?.totalSubmissions || 0}</div>
                <div className="small text-muted">Total Submissions</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <Clock size={24} className="text-warning mb-2" />
                <div className="fw-bold text-dark h4 mb-1">{liveVersion ? getVersionAge(liveVersion.createdAt) : 0}</div>
                <div className="small text-muted">Days Since Live</div>
              </div>
            </Col>
          </Row>

          {/* Version Performance Breakdown */}
          {topVersions.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-3">
                <TrendingUp size={18} className="me-2" />
                Top Performing Versions
              </h6>

              {topVersions.map((versionStat, index) => {
                const version = versions.find((v) => v.versionSha === versionStat.versionSha);
                if (!version) return null;

                const percentage = submissionStats?.totalSubmissions ? (versionStat.submissionCount / submissionStats.totalSubmissions) * 100 : 0;

                return (
                  <div key={versionStat.versionSha} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <Badge bg={index === 0 ? 'success' : index === 1 ? 'primary' : 'secondary'} className="me-2">
                          #{index + 1}
                        </Badge>
                        <code className="me-2">{version.versionSha.slice(0, 8)}</code>
                        <span className="text-dark">{version.description || 'No description'}</span>
                        {version.isPublished && (
                          <Badge bg="success" className="ms-2">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-dark">{versionStat.submissionCount} submissions</div>
                        <div className="small text-muted">{percentage.toFixed(1)}% of total</div>
                      </div>
                    </div>
                    <ProgressBar
                      now={percentage}
                      variant={index === 0 ? 'success' : index === 1 ? 'primary' : 'secondary'}
                      style={{ height: '8px' }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Version Timeline */}
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-3">
              <Clock size={18} className="me-2" />
              Version Timeline
            </h6>

            <div className="position-relative">
              {/* Timeline line */}
              <div
                className="position-absolute"
                style={{
                  left: '20px',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  backgroundColor: 'var(--bs-gray-200)',
                  zIndex: 1,
                }}
              />

              {versions
                .slice()
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((version) => {
                  const versionStat = submissionStats?.versionBreakdown?.find((s) => s.versionSha === version.versionSha);

                  return (
                    <div key={version.versionSha} className="position-relative d-flex align-items-center mb-3">
                      {/* Timeline node */}
                      <div
                        className="position-absolute d-flex align-items-center justify-content-center rounded-circle bg-white border"
                        style={{
                          left: '12px',
                          width: '16px',
                          height: '16px',
                          borderColor: version.isPublished ? '#198754' : '#6c757d',
                          borderWidth: '2px',
                          zIndex: 2,
                        }}
                      >
                        <div
                          className="rounded-circle"
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: version.isPublished ? 'var(--bs-success)' : 'var(--bs-secondary)',
                          }}
                        />
                      </div>

                      {/* Timeline content */}
                      <div className="ms-5 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="d-flex align-items-center">
                              <code className="me-2">{version.versionSha.slice(0, 8)}</code>
                              {version.isPublished && (
                                <Badge bg="success" className="me-2">
                                  LIVE
                                </Badge>
                              )}
                              <span className="fw-semibold text-dark">{version.description || 'No description'}</span>
                            </div>
                            <div className="small text-muted">
                              {new Date(version.createdAt).toLocaleDateString()} • {version.author.name}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-primary">{versionStat?.submissionCount || 0}</div>
                            <div className="small text-muted">submissions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-light p-3 rounded">
            <h6 className="fw-bold text-dark mb-2">
              <TrendingUp size={16} className="me-2" />
              Key Insights
            </h6>
            <ul className="list-unstyled mb-0 small">
              {topVersions.length > 0 && (
                <li className="mb-1">
                  • Version <code>{topVersions[0].versionSha.slice(0, 8)}</code> is your top performer with {topVersions[0].submissionCount}{' '}
                  submissions
                </li>
              )}
              {draftVersions > 0 && (
                <li className="mb-1">
                  • You have {draftVersions} draft version{draftVersions !== 1 ? 's' : ''}
                  ready for testing
                </li>
              )}
              {liveVersion && <li className="mb-1">• Current live version has been active for {getVersionAge(liveVersion.createdAt)} days</li>}
              <li>
                • Total version activity: {versions.length} version{versions.length !== 1 ? 's' : ''}
                created across {Math.ceil(versions.length / 30)} months
              </li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

import { Link } from '@tanstack/react-router';
import { ArrowDownRight, Calendar, Edit3, Eye, GitBranch, GitCommit, Info, User } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { FormVersion } from '../../types/api';
import { CreateVersionButton } from './create-version-button';
import { VersionActionsToolbar } from './version-actions-toolbar';
import { VersionComparisonModal } from './version-comparison-modal';
import { VersionComparisonSelectorModal } from './version-comparison-selector-modal';

interface EnhancedVersionHistoryTreeProps {
  formId: number;
  versions: FormVersion[];
  liveVersionSha: string | null;
  onVersionSelect?: (version: FormVersion) => void;
  showActions?: boolean;
}

/**
 * Enhanced version history tree with flowchart-style visualization.
 * Displays chronological version timeline with arrows showing derivation relationships.
 * Implements Phase 4 requirements with metadata tracking and audit trails.
 */
export const EnhancedVersionHistoryTree = ({ formId, versions, liveVersionSha }: EnhancedVersionHistoryTreeProps) => {
  const [showComparisonSelector, setShowComparisonSelector] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedVersionsForComparison, setSelectedVersionsForComparison] = useState<[FormVersion, FormVersion] | null>(null);

  // Sort versions by creation date (newest first) and build relationship map
  const sortedVersions = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Create a map to find parent relationships
  const versionMap = new Map(sortedVersions.map((v) => [v.versionSha, v]));

  // Find the latest version for controlled editing
  const latestVersion = sortedVersions.length > 0 ? sortedVersions[0] : null;

  const handleCompareVersions = (version1: FormVersion, version2: FormVersion) => {
    setSelectedVersionsForComparison([version1, version2]);
    setShowComparisonSelector(false);
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
    setSelectedVersionsForComparison(null);
  };

  const getVersionStatusInfo = (version: FormVersion) => {
    const isLive = version.versionSha === liveVersionSha;

    if (isLive) {
      return {
        badge: 'LIVE',
        badgeColor: 'success',
        iconColor: 'var(--bs-success)',
        borderColor: 'var(--bs-success)',
      };
    }

    if (version.isPublished) {
      return {
        badge: 'PUBLISHED',
        badgeColor: 'primary',
        iconColor: 'var(--bs-primary)',
        borderColor: 'var(--bs-primary)',
      };
    }

    return {
      badge: 'DRAFT',
      badgeColor: 'secondary',
      iconColor: 'var(--bs-secondary)',
      borderColor: 'var(--bs-border-color)',
    };
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderVersionNode = (version: FormVersion, versionIndex: number) => {
    const statusInfo = getVersionStatusInfo(version);
    const shortSha = version.versionSha.slice(0, 8);
    const isLatestVersion = latestVersion && version.versionSha === latestVersion.versionSha;
    const isLatestDraft = isLatestVersion && !version.isPublished;

    // Check if this version has a parent (derived from another version)
    const baseVersionSha = version.metadata?.baseVersionSha;
    const parentVersion = baseVersionSha ? versionMap.get(baseVersionSha) : null;
    const hasParent = !!parentVersion;

    // Find parent version index for arrow positioning
    const parentIndex = hasParent ? sortedVersions.findIndex((v) => v.versionSha === baseVersionSha) : -1;

    return (
      <div key={version.versionSha} className="position-relative mb-4">
        {/* Flowchart Arrow from Parent */}
        {hasParent && parentIndex !== -1 && parentIndex < versionIndex && (
          <div
            className="position-absolute"
            style={{
              left: '20px',
              top: '-20px',
              width: '2px',
              height: '20px',
              background: 'linear-gradient(to bottom, var(--bs-secondary), var(--bs-primary))',
              zIndex: 1,
            }}
          >
            {/* Arrow head */}
            <div
              className="position-absolute"
              style={{
                bottom: '-3px',
                left: '-3px',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '6px solid var(--bs-primary)',
              }}
            />
          </div>
        )}

        {/* Connection info */}
        {hasParent && (
          <div className="d-flex align-items-center mb-2 ms-4">
            <div className="d-flex align-items-center text-muted small">
              <ArrowDownRight size={14} className="me-2 text-primary" />
              <span>
                From <code className="bg-light px-1 rounded">{baseVersionSha?.slice(0, 8)}</code>
                {version.metadata?.auditDescription && <span className="ms-2 text-muted fst-italic">• {version.metadata.auditDescription}</span>}
              </span>
            </div>
          </div>
        )}

        {/* Version Node Circle */}
        <div className="d-flex align-items-start">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle me-3 flex-shrink-0"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: statusInfo.iconColor,
              border: '3px solid white',
              boxShadow: '0 2px 8px var(--bs-box-shadow)',
              zIndex: 2,
              position: 'relative',
            }}
          >
            {hasParent ? <GitCommit size={18} className="text-white" /> : <GitBranch size={18} className="text-white" />}
          </div>

          {/* Version Card */}
          <Card className="shadow-sm border-0 flex-grow-1" style={{ borderLeft: `4px solid ${statusInfo.borderColor}` }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start">
                {/* Version Info */}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-3">
                    <Badge bg={statusInfo.badgeColor} className="me-2 fs-6">
                      {statusInfo.badge}
                    </Badge>
                    <code className="bg-light px-2 py-1 rounded me-2 text-primary">{shortSha}</code>
                  </div>

                  <h6 className="mb-2 fw-semibold text-dark">{version.description || 'No description provided'}</h6>

                  <div className="d-flex align-items-center text-muted small mb-2">
                    <User size={14} className="me-1" />
                    <span className="me-3">{version.author.name}</span>
                    <Calendar size={14} className="me-1" />
                    <span className="me-3">{formatRelativeTime(version.createdAt)}</span>
                    {version.publishedAt && version.publishedAt !== version.createdAt && (
                      <span className="text-success">Published {formatRelativeTime(version.publishedAt)}</span>
                    )}
                  </div>

                  {/* Metadata Display */}
                  {version.metadata && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <div className="d-flex align-items-start">
                        <Info size={14} className="me-2 mt-1 text-muted flex-shrink-0" />
                        <div className="small text-muted">
                          <div>
                            <strong>Operation:</strong> {version.metadata.operation}
                          </div>
                          {version.metadata.auditDescription && (
                            <div>
                              <strong>Details:</strong> {version.metadata.auditDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="ms-3 d-flex flex-column gap-2">
                  {/* Edit button only for latest draft */}
                  {isLatestDraft && (
                    <Link
                      to="/forms/$formId/versions/$versionId/edit"
                      params={{ formId: formId.toString(), versionId: version.versionSha }}
                      className="text-decoration-none"
                    >
                      <Button variant="primary" size="sm" className="d-flex align-items-center">
                        <Edit3 size={14} className="me-1" />
                        Edit Draft
                      </Button>
                    </Link>
                  )}

                  {/* Preview button for all versions */}
                  <Link
                    to="/forms/$formId/versions/$versionId/preview"
                    params={{ formId: formId.toString(), versionId: version.versionSha }}
                    className="text-decoration-none"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline-info" size="sm" className="d-flex align-items-center">
                      <Eye size={14} className="me-1" />
                      Preview
                    </Button>
                  </Link>

                  {/* Create New Version only for latest version */}
                  {isLatestVersion && (
                    <CreateVersionButton formId={formId} baseVersion={version} variant="outline-secondary" size="sm">
                      Create New Version
                    </CreateVersionButton>
                  )}

                  {/* Version Options */}
                  <VersionActionsToolbar formId={formId} version={version} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  };

  if (sortedVersions.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 64, height: 64, backgroundColor: 'var(--bs-gray-100)' }}
          >
            <GitBranch size={24} className="text-muted" />
          </div>
          <h6 className="text-muted mb-2">No Version History</h6>
          <p className="text-muted small mb-0">Version history will appear here once you start creating and modifying form schemas</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Card className="border-0 shadow-sm">
        <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
                style={{ width: 40, height: 40, backgroundColor: 'var(--bs-primary-bg-subtle)' }}
              >
                <GitBranch size={20} className="text-primary" />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Enhanced Version History</h5>
                <p className="text-muted small mb-0">Interactive timeline with derivation tracking and audit trail</p>
              </div>
            </div>

            {/* Compare Versions Button */}
            {versions.length >= 2 && (
              <Button variant="outline-primary" size="sm" onClick={() => setShowComparisonSelector(true)} className="d-flex align-items-center">
                <Eye size={14} className="me-1" />
                Compare Versions
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Version Timeline */}
          <div className="version-timeline">{sortedVersions.map((version, index) => renderVersionNode(version, index))}</div>

          {/* Footer Statistics */}
          <div className="border-top pt-3 mt-4">
            <div className="row text-center">
              <div className="col-4">
                <div className="small text-muted">Total Versions</div>
                <div className="fw-bold text-dark">{versions.length}</div>
              </div>
              <div className="col-4">
                <div className="small text-muted">Published</div>
                <div className="fw-bold text-primary">{versions.filter((v) => v.isPublished).length}</div>
              </div>
              <div className="col-4">
                <div className="small text-muted">Drafts</div>
                <div className="fw-bold text-secondary">{versions.filter((v) => !v.isPublished).length}</div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Version Comparison Modals */}
      <VersionComparisonSelectorModal
        show={showComparisonSelector}
        onHide={() => setShowComparisonSelector(false)}
        versions={versions}
        onCompare={handleCompareVersions}
      />

      {selectedVersionsForComparison && (
        <VersionComparisonModal show={showComparison} onHide={handleCloseComparison} versions={selectedVersionsForComparison} formId={formId} />
      )}
    </div>
  );
};

import type { FormVersion } from '@/types/api';
import { ChevronDown, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';

/**
 * Props for the VersionSelector component
 */
interface VersionSelectorProps {
  versions: FormVersion[];
  currentVersionSha: string | null;
  liveVersionSha: string | null;
  onVersionSelect: (version: FormVersion) => void;
  disabled?: boolean;
  size?: 'sm' | 'lg';
}

/**
 * VersionSelector component for switching between form versions
 * Displays current version with dropdown for version selection
 *
 * Features:
 * - Shows current version with status badges (Live/Published/Draft)
 * - Dropdown with chronological version list
 * - Author information and timestamps
 * - Version SHA display for identification
 * - Disabled state support for processing
 */
export const VersionSelector = ({ versions, currentVersionSha, liveVersionSha, onVersionSelect, disabled = false, size }: VersionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentVersion = versions.find((v) => v.versionSha === currentVersionSha);
  const sortedVersions = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatVersionDisplay = (version: FormVersion) => {
    const isLive = version.versionSha === liveVersionSha;
    const shortSha = version.versionSha.slice(0, 8);
    const displayText = version.description || `Version ${shortSha}`;
    return isLive ? `${displayText} (Live)` : displayText;
  };

  return (
    <Dropdown show={isOpen} onToggle={setIsOpen}>
      <Dropdown.Toggle
        as={Button}
        variant="outline-secondary"
        disabled={disabled}
        size={size}
        className="d-flex align-items-center"
        style={{ minWidth: '200px' }}
      >
        <GitBranch size={16} className="me-2" />
        <span className="flex-grow-1 text-start">{currentVersion ? formatVersionDisplay(currentVersion) : 'Select Version'}</span>
        <ChevronDown size={16} className="ms-1" />
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
        <Dropdown.Header className="d-flex align-items-center">
          <GitBranch size={14} className="me-2" />
          <span className="fw-bold">Version History</span>
        </Dropdown.Header>

        {sortedVersions.length === 0 ? (
          <Dropdown.Item disabled>
            <div className="text-center py-3">
              <div className="text-muted small">No versions available</div>
            </div>
          </Dropdown.Item>
        ) : (
          sortedVersions.map((version) => {
            const isSelected = version.versionSha === currentVersionSha;
            const isLive = version.versionSha === liveVersionSha;
            const shortSha = version.versionSha.slice(0, 8);

            return (
              <Dropdown.Item key={version.versionSha} onClick={() => onVersionSelect(version)} active={isSelected} className="py-3">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <code className="small text-muted me-2">{shortSha}</code>
                      {isLive && (
                        <span className="badge bg-success me-2" style={{ fontSize: '0.65rem' }}>
                          LIVE
                        </span>
                      )}
                      {version.isPublished && !isLive && (
                        <span className="badge bg-primary me-2" style={{ fontSize: '0.65rem' }}>
                          PUBLISHED
                        </span>
                      )}
                      {!version.isPublished && (
                        <span className="badge bg-secondary me-2" style={{ fontSize: '0.65rem' }}>
                          DRAFT
                        </span>
                      )}
                    </div>
                    <div className="fw-medium text-dark small">{version.description || 'No description'}</div>
                    <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem' }}>
                      <span className="me-3">by {version.author.name}</span>
                      <span>
                        {new Date(version.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="text-primary ms-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '16px', height: '16px', backgroundColor: 'currentColor' }}
                      >
                        <div className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: 'var(--bs-body-bg)' }} />
                      </div>
                    </div>
                  )}
                </div>
              </Dropdown.Item>
            );
          })
        )}

        {versions.length > 0 && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item disabled>
              <div className="text-center">
                <small className="text-muted">
                  {versions.length} version{versions.length !== 1 ? 's' : ''} total
                </small>
              </div>
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

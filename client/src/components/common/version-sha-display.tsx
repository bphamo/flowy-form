import { GitCommit } from 'lucide-react';

interface VersionShaDisplayProps {
  versionSha: string;
  className?: string;
}

/**
 * Simple version SHA display component for forms and submissions.
 * Shows the version identifier at the bottom of forms/submissions.
 */
export const VersionShaDisplay = ({ versionSha, className = '' }: VersionShaDisplayProps) => {
  const shortSha = versionSha.slice(0, 8);

  return (
    <div className={`d-flex align-items-center justify-content-center text-muted small py-2 ${className}`}>
      <GitCommit size={14} className="me-2" />
      <span>
        Version <code className="px-1 rounded text-primary" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>{shortSha}</code>
      </span>
    </div>
  );
};

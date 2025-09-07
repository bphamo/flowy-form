import { CheckCircle, Clock, FileText, RefreshCw } from 'lucide-react';
import { Badge } from 'react-bootstrap';

export type SubmissionStatus = 'SUBMITTED' | 'REVIEWING' | 'PENDING_UPDATES' | 'COMPLETED';

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  size?: 'normal' | 'small';
}

export function SubmissionStatusBadge({ status, size = 'normal' }: SubmissionStatusBadgeProps) {
  const iconSize = size === 'small' ? 12 : 14;
  const className = size === 'small' ? 'd-flex align-items-center small' : 'd-flex align-items-center';

  const getStatusConfig = (status: SubmissionStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return {
          variant: 'primary' as const,
          icon: <FileText size={iconSize} className="me-1" />,
          label: 'Submitted',
        };
      case 'REVIEWING':
        return {
          variant: 'warning' as const,
          icon: <Clock size={iconSize} className="me-1" />,
          label: 'Under Review',
        };
      case 'PENDING_UPDATES':
        return {
          variant: 'info' as const,
          icon: <RefreshCw size={iconSize} className="me-1" />,
          label: 'Pending Updates',
        };
      case 'COMPLETED':
        return {
          variant: 'success' as const,
          icon: <CheckCircle size={iconSize} className="me-1" />,
          label: 'Completed',
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <FileText size={iconSize} className="me-1" />,
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge bg={config.variant} className={className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
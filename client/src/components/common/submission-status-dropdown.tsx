import { CheckCircle, Clock, FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { SubmissionStatus, SubmissionStatusBadge } from './submission-status-badge';

interface SubmissionStatusDropdownProps {
  currentStatus: SubmissionStatus;
  onStatusChange: (newStatus: SubmissionStatus) => void;
  disabled?: boolean;
  size?: 'normal' | 'small';
}

export function SubmissionStatusDropdown({ currentStatus, onStatusChange, disabled = false, size = 'normal' }: SubmissionStatusDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions: Array<{
    value: SubmissionStatus;
    label: string;
    icon: React.ReactNode;
    variant: string;
  }> = [
    {
      value: 'SUBMITTED',
      label: 'Submitted',
      icon: <FileText size={14} className="me-2" />,
      variant: 'primary',
    },
    {
      value: 'REVIEWING',
      label: 'Under Review',
      icon: <Clock size={14} className="me-2" />,
      variant: 'warning',
    },
    {
      value: 'PENDING_UPDATES',
      label: 'Pending Updates',
      icon: <RefreshCw size={14} className="me-2" />,
      variant: 'info',
    },
    {
      value: 'COMPLETED',
      label: 'Completed',
      icon: <CheckCircle size={14} className="me-2" />,
      variant: 'success',
    },
  ];

  const handleStatusChange = async (newStatus: SubmissionStatus) => {
    if (newStatus === currentStatus || isLoading) return;

    setIsLoading(true);
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle
        as="div"
        className="cursor-pointer"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
        disabled={disabled || isLoading}
      >
        <SubmissionStatusBadge status={currentStatus} size={size} />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Header>Change Status</Dropdown.Header>
        {statusOptions
          .filter((option) => option.value !== currentStatus)
          .map((option) => (
            <Dropdown.Item
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isLoading}
              className="d-flex align-items-center"
            >
              {option.icon}
              {option.label}
            </Dropdown.Item>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

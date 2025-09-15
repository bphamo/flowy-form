import { AlertTriangle, Clock, GitBranch, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { FormVersion } from '../../types/api';

interface VersionRevertModalProps {
  show: boolean;
  onHide: () => void;
  version: FormVersion;
  onRevert: (operation: RevertOperation, description?: string) => Promise<void>;
}

export type RevertOperation = 'force_reset' | 'make_live' | 'make_latest';

interface RevertOption {
  id: RevertOperation;
  title: string;
  description: string;
  icon: React.ReactElement;
  destructive: boolean;
  warning: string;
}

/**
 * Modal component for selecting and confirming version revert operations.
 * Provides three revert strategies with clear warnings and multi-step confirmation.
 */
export const VersionRevertModal = ({ show, onHide, version, onRevert }: VersionRevertModalProps) => {
  const [selectedOperation, setSelectedOperation] = useState<RevertOperation | null>(null);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const revertOptions: RevertOption[] = [
    {
      id: 'force_reset',
      title: 'Reset to This Version (Destructive)',
      description: 'Delete all newer versions and make this version the current live version.',
      icon: <AlertTriangle size={20} className="text-danger" />,
      destructive: true,
      warning: 'This will permanently delete all newer versions. This action cannot be undone.',
    },
    {
      id: 'make_live',
      title: 'Make This Version Live',
      description: 'Set this version as the published version while preserving all history.',
      icon: <Clock size={20} className="text-warning" />,
      destructive: false,
      warning: 'This will change which version receives new submissions but preserves all history.',
    },
    {
      id: 'make_latest',
      title: 'Create New Version from This',
      description: "Create a new draft version using this version's schema as the starting point.",
      icon: <GitBranch size={20} className="text-info" />,
      destructive: false,
      warning: 'This creates a new version without affecting existing history.',
    },
  ];

  const selectedOption = revertOptions.find((opt) => opt.id === selectedOperation);

  const handleNext = () => {
    if (selectedOperation) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOperation) return;

    setIsProcessing(true);
    try {
      await onRevert(selectedOperation, description);
      onHide();
      resetModal();
    } catch (error) {
      console.error('Revert operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setSelectedOperation(null);
    setDescription('');
    setShowConfirmation(false);
    setIsProcessing(false);
  };

  const handleHide = () => {
    if (!isProcessing) {
      onHide();
      resetModal();
    }
  };

  return (
    <Modal show={show} onHide={handleHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <RotateCcw size={20} className="me-2" />
          Version Options
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!showConfirmation ? (
          // Step 1: Select revert strategy
          <>
            <div className="mb-4">
              <h6 className="fw-bold">Version Information</h6>
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>SHA:</strong> <code>{version.versionSha}</code>
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(version.createdAt!).toLocaleString()}
                  </div>
                </div>
                {version.description && (
                  <div className="mt-2">
                    <strong>Description:</strong> {version.description}
                  </div>
                )}
              </div>
            </div>

            <h6 className="fw-bold mb-3">Select Version Option</h6>

            {revertOptions.map((option) => (
              <div
                key={option.id}
                className={`border rounded p-3 mb-3 cursor-pointer ${selectedOperation === option.id ? 'border-primary' : 'border-light'}`}
                style={{
                  backgroundColor: selectedOperation === option.id ? 'var(--bs-secondary-bg)' : 'transparent'
                }}
                onClick={() => setSelectedOperation(option.id)}
                role="button"
              >
                <Form.Check
                  type="radio"
                  id={option.id}
                  name="revertOperation"
                  checked={selectedOperation === option.id}
                  onChange={() => setSelectedOperation(option.id)}
                  className="d-none"
                />

                <div className="d-flex align-items-start">
                  <div className="me-3 mt-1">{option.icon}</div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 d-flex align-items-center">
                      {option.title}
                      {option.destructive && <span className="badge bg-danger ms-2">Destructive</span>}
                    </h6>
                    <p className="text-muted mb-2">{option.description}</p>
                    <Alert variant={option.destructive ? 'danger' : 'warning'} className="mb-0 py-2">
                      <small>{option.warning}</small>
                    </Alert>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          // Step 2: Confirmation with description
          <>
            <Alert variant={selectedOption?.destructive ? 'danger' : 'warning'}>
              <div className="d-flex align-items-center">
                {selectedOption?.icon}
                <div className="ms-2">
                  <strong>Confirm: {selectedOption?.title}</strong>
                  <div className="mt-1">{selectedOption?.warning}</div>
                </div>
              </div>
            </Alert>

            <div className="mb-3">
              <label className="form-label">Description (Optional)</label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe why you're reverting to this version..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isProcessing}
              />
              <Form.Text className="text-muted">This description will be recorded for audit purposes.</Form.Text>
            </div>

            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
              <h6 className="mb-2">Target Version</h6>
              <div>
                <strong>SHA:</strong> <code>{version.versionSha}</code>
              </div>
              {version.description && (
                <div>
                  <strong>Description:</strong> {version.description}
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {!showConfirmation ? (
          <>
            <Button variant="secondary" onClick={handleHide} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNext} disabled={!selectedOperation || isProcessing}>
              Next
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setShowConfirmation(false)} disabled={isProcessing}>
              Back
            </Button>
            <Button variant={selectedOption?.destructive ? 'danger' : 'warning'} onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Processing...
                </>
              ) : (
                `Confirm ${selectedOption?.title}`
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

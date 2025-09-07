import { Code, Eye, GitCompare } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Modal, Tab, Tabs } from 'react-bootstrap';
import { api } from '../../lib/api';
import { FormVersion } from '../../types/api';

interface VersionComparisonModalProps {
  show: boolean;
  onHide: () => void;
  versions: [FormVersion, FormVersion];
  formId: number;
}

interface SchemaDiff {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

/**
 * Modal component for comparing two form versions side by side.
 * Shows schema differences with visual highlighting and impact preview.
 */
export const VersionComparisonModal = ({ show, onHide, versions, formId }: VersionComparisonModalProps) => {
  const [diff, setDiff] = useState<SchemaDiff | null>(null);
  const [activeTab, setActiveTab] = useState('visual');

  const [olderVersion, newerVersion] = versions.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

  const calculateDiff = useCallback(async () => {
    // Simple schema comparison logic
    // TODO: Implement more sophisticated schema diffing
    try {
      // Fetch schemas from API since FormVersion doesn't include schema by default
      const [oldVersionResponse, newVersionResponse] = await Promise.all([
        api.versions.get(formId, olderVersion.versionSha),
        api.versions.get(formId, newerVersion.versionSha),
      ]);

      const oldSchema = oldVersionResponse.data.schema as Record<string, unknown>;
      const newSchema = newVersionResponse.data.schema as Record<string, unknown>;

      const oldComponents = (oldSchema?.components as Record<string, unknown>[]) || [];
      const newComponents = (newSchema?.components as Record<string, unknown>[]) || [];

      const added: string[] = [];
      const removed: string[] = [];
      const modified: string[] = [];
      const unchanged: string[] = [];

      // Track components by key/label for comparison
      const oldComponentMap = new Map();
      const newComponentMap = new Map();

      oldComponents.forEach((comp: Record<string, unknown>) => {
        const key = comp.key || comp.label || comp.type;
        oldComponentMap.set(key, comp);
      });

      newComponents.forEach((comp: Record<string, unknown>) => {
        const key = comp.key || comp.label || comp.type;
        newComponentMap.set(key, comp);
      });

      // Find added components
      newComponentMap.forEach((comp, key) => {
        if (!oldComponentMap.has(key)) {
          added.push(`${comp.type}: ${comp.label || comp.key || 'Untitled'}`);
        }
      });

      // Find removed components
      oldComponentMap.forEach((comp, key) => {
        if (!newComponentMap.has(key)) {
          removed.push(`${comp.type}: ${comp.label || comp.key || 'Untitled'}`);
        }
      });

      // Find modified components
      oldComponentMap.forEach((oldComp, key) => {
        if (newComponentMap.has(key)) {
          const newComp = newComponentMap.get(key);
          if (JSON.stringify(oldComp) !== JSON.stringify(newComp)) {
            modified.push(`${oldComp.type}: ${oldComp.label || oldComp.key || 'Untitled'}`);
          } else {
            unchanged.push(`${oldComp.type}: ${oldComp.label || oldComp.key || 'Untitled'}`);
          }
        }
      });

      setDiff({ added, removed, modified, unchanged });
    } catch (error) {
      console.error('Failed to fetch schemas for comparison:', error);
      setDiff({ added: [], removed: [], modified: [], unchanged: [] });
    }
  }, [formId, olderVersion.versionSha, newerVersion.versionSha]);

  useEffect(() => {
    if (show && versions.length === 2) {
      calculateDiff();
    }
  }, [show, versions, calculateDiff]);

  const renderSchemaJson = (schema: Record<string, unknown>, title: string) => (
    <div className="h-100">
      <h6 className="fw-bold mb-3">{title}</h6>
      <div className="bg-dark text-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto' }}>
        <pre className="mb-0">
          <code>{JSON.stringify(schema, null, 2)}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <GitCompare size={20} className="me-2" />
          Version Comparison
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Version Info */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="bg-light p-3 rounded">
              <h6 className="fw-bold text-danger">Older Version</h6>
              <div>
                <strong>SHA:</strong> <code>{olderVersion.versionSha}</code>
              </div>
              <div>
                <strong>Created:</strong> {new Date(olderVersion.createdAt!).toLocaleString()}
              </div>
              {olderVersion.description && (
                <div>
                  <strong>Description:</strong> {olderVersion.description}
                </div>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="bg-light p-3 rounded">
              <h6 className="fw-bold text-success">Newer Version</h6>
              <div>
                <strong>SHA:</strong> <code>{newerVersion.versionSha}</code>
              </div>
              <div>
                <strong>Created:</strong> {new Date(newerVersion.createdAt!).toLocaleString()}
              </div>
              {newerVersion.description && (
                <div>
                  <strong>Description:</strong> {newerVersion.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Tabs */}
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'visual')} className="mb-3">
          <Tab
            eventKey="visual"
            title={
              <span>
                <Eye size={16} className="me-2" />
                Visual Differences
              </span>
            }
          >
            {diff && (
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold text-success">Added Components ({diff.added.length})</h6>
                  {diff.added.length > 0 ? (
                    <ul className="list-group mb-3">
                      {diff.added.map((item, index) => (
                        <li key={index} className="list-group-item list-group-item-success">
                          + {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Alert variant="light">No components added</Alert>
                  )}

                  <h6 className="fw-bold text-danger">Removed Components ({diff.removed.length})</h6>
                  {diff.removed.length > 0 ? (
                    <ul className="list-group mb-3">
                      {diff.removed.map((item, index) => (
                        <li key={index} className="list-group-item list-group-item-danger">
                          - {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Alert variant="light">No components removed</Alert>
                  )}
                </div>

                <div className="col-md-6">
                  <h6 className="fw-bold text-warning">Modified Components ({diff.modified.length})</h6>
                  {diff.modified.length > 0 ? (
                    <ul className="list-group mb-3">
                      {diff.modified.map((item, index) => (
                        <li key={index} className="list-group-item list-group-item-warning">
                          ± {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Alert variant="light">No components modified</Alert>
                  )}

                  <h6 className="fw-bold text-muted">Unchanged Components ({diff.unchanged.length})</h6>
                  {diff.unchanged.length > 0 ? (
                    <div className="text-muted">
                      <small>{diff.unchanged.length} components remain unchanged</small>
                    </div>
                  ) : (
                    <Alert variant="light">No unchanged components</Alert>
                  )}
                </div>
              </div>
            )}
          </Tab>

          <Tab
            eventKey="schema"
            title={
              <span>
                <Code size={16} className="me-2" />
                Schema JSON
              </span>
            }
          >
            <div className="row">
              <div className="col-md-6">{renderSchemaJson({}, 'Older Schema (Schema comparison in JSON view not yet implemented)')}</div>
              <div className="col-md-6">{renderSchemaJson({}, 'Newer Schema (Schema comparison in JSON view not yet implemented)')}</div>
            </div>
          </Tab>
        </Tabs>

        {/* Impact Preview */}
        {diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0) && (
          <Alert variant="info">
            <h6 className="mb-2">Impact Preview</h6>
            <div>
              <strong>Changes detected:</strong> {diff.added.length} added, {diff.removed.length} removed, {diff.modified.length} modified
            </div>
            <div className="mt-2">
              <small>
                These changes may affect existing form submissions and user experience. Review carefully before reverting to an older version.
              </small>
            </div>
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

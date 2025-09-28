// Schema Preview Modal Component
import { Webform } from '@formio/js';
import { Form, FormBuilder, Submission, type FormType } from '@formio/react';
import { Code2, Eye, FileText, Monitor } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, Card, Modal, Tab, Tabs } from 'react-bootstrap';

interface SchemaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: FormType;
  title?: string;
}

export const SchemaPreviewModal = ({ isOpen, onClose, schema, title = 'AI Generated Schema Preview' }: SchemaPreviewModalProps) => {
  const [activeTab, setActiveTab] = useState('form');

  const handleFormSubmit = (submission: Submission) => {
    // This is just for preview - don't actually submit
    console.log('Preview form submission:', submission);
  };

  const handleFormReady = (formInstance: Webform) => {
    // Preview form is ready
    console.log('Preview form ready:', formInstance);
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" className="ai-preview-modal">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <Eye size={20} className="me-2 text-primary" />
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'form')} className="px-3 pt-3">
          <Tab
            eventKey="form"
            title={
              <span className="d-flex align-items-center">
                <FileText size={16} className="me-2" />
                Form Preview
              </span>
            }
          >
            <div className="p-3">
              <Alert variant="info" className="mb-3">
                <Monitor size={16} className="me-2" />
                This is how your form will appear to users. All interactions are disabled in preview mode.
              </Alert>

              <Card className="border">
                <Card.Body>
                  {schema && schema.components ? (
                    <Form
                      form={schema}
                      onSubmit={handleFormSubmit}
                      onFormReady={handleFormReady}
                      options={{
                        readOnly: true, // Make it read-only for preview
                        noAlerts: true,
                        buttonSettings: {
                          showCancel: false,
                          showPrevious: false,
                          showNext: false,
                          showSubmit: false, // Hide submit button in preview
                        },
                      }}
                      src={''}
                    />
                  ) : (
                    <Alert variant="warning">No valid schema to preview. The generated schema may be empty or invalid.</Alert>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Tab>

          <Tab
            eventKey="builder"
            title={
              <span className="d-flex align-items-center">
                <Code2 size={16} className="me-2" />
                Builder Preview
              </span>
            }
          >
            <div className="p-3">
              <Alert variant="info" className="mb-3">
                <Code2 size={16} className="me-2" />
                This is how the schema will appear in the form builder. All editing is disabled in preview mode.
              </Alert>

              <Card className="border">
                <Card.Body style={{ minHeight: '400px' }}>
                  {schema && schema.components ? (
                    <FormBuilder
                      initialForm={schema}
                      options={{
                        builder: {
                          basic: true,
                          advanced: false,
                          data: true,
                          layout: true,
                          premium: false,
                        },
                        editForm: {
                          // Disable editing in preview
                          display: 'form',
                        },
                        disabled: ['*'], // Disable all component interactions in preview mode
                      }}
                      // Provide empty callbacks to prevent editing but satisfy the interface
                      onSaveComponent={() => {}}
                      onDeleteComponent={() => {}}
                      onBuilderReady={() => {}}
                    />
                  ) : (
                    <Alert variant="warning">No valid schema to preview in builder mode.</Alert>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Tab>

          <Tab
            eventKey="json"
            title={
              <span className="d-flex align-items-center">
                <Code2 size={16} className="me-2" />
                JSON Schema
              </span>
            }
          >
            <div className="p-3">
              <Alert variant="info" className="mb-3">
                <Code2 size={16} className="me-2" />
                Raw JSON schema that will be applied to your form.
              </Alert>

              <Card className="border">
                <Card.Body>
                  <pre className="bg-light p-3 rounded small overflow-auto" style={{ maxHeight: '400px', fontSize: '0.85rem' }}>
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                </Card.Body>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close Preview
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

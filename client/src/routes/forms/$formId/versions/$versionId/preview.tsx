import { PageHeader } from '@/components/common/page-header';
import { VersionShaDisplay } from '@/components/common/version-sha-display';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth-utils';
import { Webform } from '@formio/js';
import { Form, Submission } from '@formio/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Eye, FileText, Info, Laptop, Monitor, Shield } from 'lucide-react';
import { useRef, useState } from 'react';
import { Alert, Card, Container, Tab, Tabs } from 'react-bootstrap';
import { toast } from 'sonner';

export const Route = createFileRoute('/forms/$formId/versions/$versionId/preview')({
  beforeLoad: ({ context }) => {
    requireAuth(context, window.location.pathname);
  },
  loader: async ({ params }) => {
    const formId = parseInt(params.formId);
    const versionId = params.versionId;

    if (isNaN(formId)) {
      throw new Error('Invalid form ID');
    }

    // Get form basic info
    const formResponse = await api.forms.get(formId);

    // Get specific version with schema
    const versionResponse = await api.versions.get(formId, versionId);

    return {
      form: formResponse.data,
      version: versionResponse.data,
    };
  },
  component: VersionPreviewPage,
});

function VersionPreviewPage() {
  const { form, version } = Route.useLoaderData();
  const { formId } = Route.useParams();
  const [submissionData, setSubmissionData] = useState(null);
  const [activeTab, setActiveTab] = useState('normal');
  const previewRef = useRef<Webform>(null);

  const handleSubmit = (submission: Submission) => {
    if (previewRef.current) {
      previewRef.current.emit('submitDone', submission);
      setSubmissionData(submission.data as unknown as null);
      toast.success('PREVIEW: Form submitted successfully');
    }
  };

  const handleFormReady = (formInstance: Webform) => {
    previewRef.current = formInstance;
  };

  // Component for embedded view rendering
  const EmbeddedPreview = () => (
    <div className="border rounded p-3" style={{ backgroundColor: 'var(--bs-gray-100)' }}>
      <div className="small text-muted mb-3 text-center">
        <Monitor size={16} className="me-1" />
        This is how your form appears when embedded on external websites
      </div>

      {/* Simulated iframe container with embedded styling */}
      <div
        className="mx-auto border rounded shadow-sm"
        style={{
          maxWidth: '600px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: '400px',
          backgroundColor: 'var(--bs-body-bg)',
        }}
      >
        <div className="p-3">
          {/* Embedded form header - minimal styling */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom py-3">
              <div className="d-flex align-items-center">
                <FileText size={20} className="text-primary me-2" />
                <div>
                  <h5 className="mb-0 fw-bold">{form.name}</h5>
                  <small className="text-muted">Complete all required fields and submit</small>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-3">
              {version.schema ? (
                <Form
                  src={version.schema}
                  onSubmit={handleSubmit}
                  onFormReady={handleFormReady}
                  options={{
                    readOnly: false,
                    noAlerts: true,
                    buttonSettings: {
                      showCancel: false,
                      showPrevious: false,
                      showNext: false,
                      showSubmit: true,
                    },
                  }}
                />
              ) : (
                <Alert variant="warning">
                  <strong>No Schema Available</strong>
                  <div>This version doesn't have a valid schema to preview.</div>
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Minimal security notice for embedded preview */}
          <div className="mt-3 p-2 bg-light rounded">
            <div className="d-flex align-items-start">
              <Shield size={16} className="text-success me-2 mt-1 flex-shrink-0" />
              <div className="small text-muted">Embedded form with secure submission handling</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Component for normal preview rendering
  const NormalPreview = () => (
    <div className="row">
      {/* Form Preview */}
      <div className="col-lg-8">
        <Card className="shadow-sm border-0">
          <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
            <h5 className="mb-0 fw-semibold">Form Preview</h5>
            <small className="text-muted">This is how the form looked in this version</small>
          </Card.Header>
          <Card.Body className="p-4">
            {version.schema ? (
              <Form
                src={version.schema}
                onSubmit={handleSubmit}
                onFormReady={handleFormReady}
                options={{
                  readOnly: false,
                  noAlerts: true,
                  buttonSettings: {
                    showCancel: false,
                    showPrevious: false,
                    showNext: false,
                    showSubmit: true,
                  },
                }}
              />
            ) : (
              <Alert variant="warning">
                <strong>No Schema Available</strong>
                <div>This version doesn't have a valid schema to preview.</div>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Submission Data (if any) */}
      <div className="col-lg-4">
        <Card className="shadow-sm border-0">
          <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
            <h6 className="mb-0 fw-semibold">Preview Submission Data</h6>
            <small className="text-muted">Data from form interactions</small>
          </Card.Header>
          <Card.Body className="p-4">
            {submissionData ? (
              <div>
                <Alert variant="success" className="mb-3">
                  <strong>Form Submitted!</strong> This is preview data only.
                </Alert>
                <div className="bg-light p-3 rounded">
                  <pre className="mb-0 small">
                    <code>{JSON.stringify(submissionData, null, 2)}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <Eye size={48} className="opacity-50 mb-3" />
                <p className="mb-0">Fill out the form to see submission data here</p>
                <small>This is preview mode - no data will be saved</small>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-gray-100), var(--bs-gray-200))' }}>
        <Container className="py-4">
          {/* Header */}
          <div className="mb-4">
            <Link to="/forms/$formId/manage" params={{ formId }} className="btn btn-outline-secondary btn-sm mb-3">
              <ArrowLeft size={16} className="me-2" />
              Back to Form Management
            </Link>

            <PageHeader
              badge={{ icon: Eye, text: 'Version Preview' }}
              title={`${form.name} - Version Preview`}
              description={`Preview of version ${version.versionSha.slice(0, 8)} (${version.description || 'No description'})`}
            />
          </div>

          {/* Version Info Alert */}
          <Alert variant="info" className="mb-4">
            <div className="d-flex align-items-center">
              <Info size={20} className="me-2" />
              <div>
                <strong>Version Information:</strong>
                <div className="small mt-1">
                  <strong>SHA:</strong> <code>{version.versionSha}</code> •<strong className="ms-2">Status:</strong>{' '}
                  {version.isPublished ? 'Published' : 'Draft'} •<strong className="ms-2">Created:</strong>{' '}
                  {new Date(version.createdAt).toLocaleString()}
                  {version.author && (
                    <>
                      <strong className="ms-2">Author:</strong> {version.author.name}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Alert>

          {/* Preview Tabs - Only show for public forms */}
          {form.isPublic ? (
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'normal')} className="mb-4">
              <Tab
                eventKey="normal"
                title={
                  <span>
                    <Laptop size={16} className="me-2" />
                    Normal View
                  </span>
                }
              >
                <NormalPreview />
              </Tab>
              <Tab
                eventKey="embedded"
                title={
                  <span>
                    <Monitor size={16} className="me-2" />
                    Embedded View
                  </span>
                }
              >
                <EmbeddedPreview />
              </Tab>
            </Tabs>
          ) : (
            <>
              {/* Show alert for private forms */}
              <Alert variant="info" className="mb-4">
                <div className="d-flex align-items-center">
                  <Info size={20} className="me-2" />
                  <div>
                    <strong>Private Form:</strong> This form is private and cannot be embedded on external websites. Only normal preview is available.
                  </div>
                </div>
              </Alert>
              <NormalPreview />
            </>
          )}

          {/* Version SHA Display */}
          <div className="mt-4">
            <VersionShaDisplay versionSha={version.versionSha} />
          </div>
        </Container>
      </div>
    </AppLayout>
  );
}

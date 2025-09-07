import { FormBuilder as FormioFormBuilder } from '@formio/js';
import { createFileRoute, Link, useLoaderData, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/common/loading-spinner';
import { PageHeader } from '@/components/common/page-header';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth-utils';
import { createDebounce } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import Spinner from 'react-bootstrap/Spinner';

import { FormBuilder, type FormType } from '@formio/react';
import { ArrowLeft, Code, Save } from 'lucide-react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

// Move INITIAL_SCHEMA to constants file to avoid re-importing
import { INITIAL_SCHEMA } from '@/lib/constants';

export const Route = createFileRoute('/forms/$formId/versions/$versionId/edit')({
  beforeLoad: ({ context }) => {
    requireAuth(context, window.location.pathname);
  },
  loader: async ({ params }) => {
    try {
      const formId = parseInt(params.formId);
      const versionId = params.versionId;

      // Get form data and specific version with schema
      const [formResponse, versionResponse] = await Promise.all([api.forms.get(formId), api.versions.get(formId, versionId)]);

      const form = formResponse.data;
      const version = versionResponse.data;

      // Only allow editing of unpublished versions
      if (version.isPublished) {
        console.error('[Route] loader - trying to edit published version');
        throw new Error('Cannot edit published versions');
      }

      return { form, version };
    } catch (error) {
      console.error('[Route] loader error:', error);
      throw error;
    }
  },
  staleTime: 0, // Keep your requirement - always refetch
  gcTime: 0, // Keep your requirement - don't cache
  component: EditFormVersion,
  pendingComponent: () => <LoadingSpinner />,
});

function EditFormVersion() {
  const { form, version } = useLoaderData({ from: '/forms/$formId/versions/$versionId/edit' });
  const navigate = useNavigate();

  // Add stable refs to prevent unnecessary recreations
  const autoSaveCountRef = useRef(0);
  const isUnmountingRef = useRef(false);

  // Use stable initial schema reference
  const initialBuilderSchema = useRef<FormType>((version as { schema?: FormType }).schema || INITIAL_SCHEMA);
  const formBuilderRef = useRef<FormioFormBuilder>(null);
  const [processing, setProcessing] = useState(false);
  const [description, setDescription] = useState(version.description || '');

  // Track component lifecycle
  useEffect(() => {
    isUnmountingRef.current = false;

    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  // Reset description when version changes (important for preserving single load requirement)
  useEffect(() => {
    setDescription(version.description || '');
  }, [version.versionSha, version.description]);

  const handleBuilderReady = useCallback((builder: FormioFormBuilder) => {
    formBuilderRef.current = builder;
  }, []);

  // Simple change tracking - no schema comparison needed
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);

  /**
   * Saves current FormBuilder schema to server.
   * Called by debounce after user stops making changes.
   */
  const triggerAutoSave = useCallback(async () => {
    // Prevent auto-save if component is unmounting or about to unmount
    if (isUnmountingRef.current) {
      console.log('[AutoSave] Skipping save - component unmounting');
      return;
    }

    const saveId = ++autoSaveCountRef.current;

    if (!formBuilderRef.current || !form || !version) {
      console.warn(`[AutoSave ${saveId}] Missing dependencies:`, {
        hasBuilder: !!formBuilderRef.current,
        hasForm: !!form,
        hasVersion: !!version,
      });
      return;
    }

    try {
      const currentSchema = formBuilderRef.current.instance.schema;

      await api.versions.update(form.id, version.versionSha, {
        schema: currentSchema,
        description: version.description || 'Auto-saved',
      });

      // Only update state if component is still mounted
      if (!isUnmountingRef.current) {
        setHasUnsavedChanges(false);
      }
    } catch (error: unknown) {
      console.error(`[AutoSave ${saveId}] Save failed:`, error);
      // Don't show toast error for auto-save failures to avoid spam
    }
  }, [form, version]);

  // Create stable debounced auto-save handler
  const autoSaveDebounce = useMemo(() => {
    return createDebounce(triggerAutoSave, 5000);
  }, [triggerAutoSave]);

  /**
   * Manually triggers save immediately, bypassing the debounce delay.
   * Called when user clicks the "Save Now" button.
   */
  const handleManualSave = useCallback(async () => {
    if (!hasUnsavedChanges || isManualSaving) {
      return;
    }

    setIsManualSaving(true);

    try {
      // Cancel any pending auto-save
      autoSaveDebounce.cleanup();

      // Trigger save immediately
      await triggerAutoSave();
    } finally {
      setIsManualSaving(false);
    }
  }, [hasUnsavedChanges, isManualSaving, autoSaveDebounce, triggerAutoSave]);

  /**
   * Handles FormBuilder schema changes by marking as unsaved and triggering auto-save.
   * FormIO only fires this on actual changes (save/delete components).
   */
  const handleSchemaChange = useCallback(() => {
    // Prevent handling changes if component is unmounting
    if (isUnmountingRef.current) {
      return;
    }

    setHasUnsavedChanges(true);
    autoSaveDebounce.execute();
  }, [autoSaveDebounce]);

  const handleUpdateVersionDetails = async () => {
    if (!form || !version) return;
    setProcessing(true);

    try {
      await api.versions.update(form.id, version.versionSha, {
        description: description ?? version.description,
      });

      toast.success('Version details updated successfully');
    } catch (error: unknown) {
      console.error('[Action] Error updating version details:', error);
      toast.error((error as Error).message ?? 'Failed to update version details');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!form || !version) return;
    setProcessing(true);

    try {
      // Mark as unmounting to prevent any auto-save interference
      isUnmountingRef.current = true;

      // Clear any pending auto-save
      autoSaveDebounce.cleanup();

      // Get current schema from FormBuilder
      let currentSchema;
      if (formBuilderRef.current) {
        currentSchema = formBuilderRef.current.instance.schema;
      } else {
        console.error('[Action] No FormBuilder reference available');
        toast.error('No schema to publish');
        return;
      }

      if (!currentSchema) {
        console.error('[Action] Current schema is empty');
        toast.error('No schema to publish');
        return;
      }

      // First update the version with current schema
      await api.versions.update(form.id, version.versionSha, {
        schema: currentSchema,
        description: description || version.description || 'Published version',
      });

      // Mark as saved
      setHasUnsavedChanges(false);

      // Then publish it
      await api.versions.publish(form.id, version.versionSha);

      toast.success('Version published successfully');

      // Navigate immediately - no need for setTimeout
      navigate({ to: `/forms/${form.id}/manage` });
    } catch (error: unknown) {
      console.error('[Action] Error publishing version:', error);
      toast.error((error as Error).message || 'Failed to publish version');
      // Reset unmounting flag on error
      isUnmountingRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      autoSaveDebounce.cleanup();
    };
  }, [autoSaveDebounce]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Manage Forms',
      href: '/forms',
    },
    {
      title: form.name,
      href: `/forms/${form.id}/manage`,
    },
    {
      title: `Edit Version ${version.versionSha.slice(0, 8)}`,
      href: `/forms/${form.id}/versions/${version.versionSha}/edit`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
        <Container className="py-4" fluid="xxl">
          <PageHeader
            badge={{ icon: Code, text: 'Form Builder' }}
            title={`Edit Version ${version.versionSha.slice(0, 8)}`}
            description={`Editing draft version: ${version.description || 'Untitled version'}`}
          />

          {/* Back Button */}
          <div className="mb-4">
            <Link to={`/forms/${form.id}/manage`} className="text-decoration-none">
              <Button variant="outline-secondary" className="d-flex align-items-center">
                <ArrowLeft size={16} className="me-2" />
                Back to Manage
              </Button>
            </Link>
          </div>

          {/* Version Info Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <div className="d-flex align-items-center gap-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-1">Version Details</h6>
                      <p className="text-muted small mb-0">
                        Version SHA: <code>{version.versionSha}</code> • Status: <span className="badge bg-warning">Draft</span>
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex gap-2 justify-content-end"></div>
                </Col>
              </Row>
              <Row>
                {/* Description Card */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Version Description (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Describe your changes..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                    }}
                    disabled={processing}
                  />
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={() => handleUpdateVersionDetails()}
                    disabled={processing}
                    className="d-flex align-items-center"
                  >
                    <Save size={16} className="me-2" />
                    Update Version Description
                  </Button>
                  <Button variant="primary" onClick={handlePublish} disabled={processing} className="d-flex align-items-center">
                    Publish Version
                  </Button>
                </div>
              </Row>
            </Card.Body>
          </Card>

          {/* Form Builder Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="border-bottom-0 py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0 fw-bold">
                    <Code size={16} className="me-2" />
                    Form Schema Editor
                  </h5>
                  <p className="text-muted small mb-0">Drag and drop components to build your form</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {hasUnsavedChanges && (autoSaveDebounce.isPending() || isManualSaving) && (
                    <span className="d-flex align-items-center badge bg-warning text-dark">
                      <Spinner className="me-1" animation="border" role="status" size="sm" />
                      {isManualSaving ? 'Saving...' : 'Auto-saving...'}
                    </span>
                  )}
                  {hasUnsavedChanges && autoSaveDebounce.isPending() && !isManualSaving && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleManualSave}
                      className="d-flex align-items-center"
                      disabled={isManualSaving}
                    >
                      <Save size={14} className="me-1" />
                      Save Now
                    </Button>
                  )}
                  {hasUnsavedChanges && !autoSaveDebounce.isPending() && !isManualSaving && (
                    <span className="badge bg-danger text-white">Unsaved changes</span>
                  )}
                  {!hasUnsavedChanges && <span className="badge bg-success text-white">All changes saved</span>}
                </div>
              </div>
            </Card.Header>
            <Card.Body className="px-2">
              <div style={{ minHeight: '600px' }}>
                <FormBuilder
                  initialForm={initialBuilderSchema.current}
                  onSaveComponent={handleSchemaChange}
                  onDeleteComponent={handleSchemaChange}
                  onBuilderReady={handleBuilderReady}
                />
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </AppLayout>
  );
}

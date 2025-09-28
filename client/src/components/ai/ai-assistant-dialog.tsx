// AI Assistant Dialog Component
import { useState, useRef, useEffect } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { X, Wand2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { FormType } from '@formio/react';
import { aiService, type AiAssistResponse, type AiLimits } from '@/lib/ai-service';
import { toast } from 'sonner';
import './ai-assistant-dialog.css';

interface AiAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchema: FormType;
  formId: number;
  versionId: string;
  onAccept: (newSchema: FormType) => void;
  onReject: () => void;
}

export const AiAssistantDialog = ({
  isOpen,
  onClose,
  currentSchema,
  formId,
  versionId,
  onAccept,
  onReject,
}: AiAssistantDialogProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AiAssistResponse | null>(null);
  const [limits, setLimits] = useState<AiLimits | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load AI limits when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadLimits();
      // Focus the textarea when dialog opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadLimits = async () => {
    try {
      const limitsData = await aiService.getLimits();
      setLimits(limitsData);
      
      if (!limitsData.aiEnabled) {
        setError('AI assistance is not configured. Please contact your administrator.');
      }
    } catch (err) {
      setError('Failed to load AI configuration');
      console.error('Failed to load AI limits:', err);
    }
  };

  const checkComplexity = () => {
    if (!limits) return { isValid: true, complexity: 0 };
    
    const complexity = aiService.calculateSchemaComplexity(currentSchema);
    const isValid = complexity <= limits.maxComplexity;
    
    return { isValid, complexity };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message describing what you want to change.');
      return;
    }

    if (!limits?.aiEnabled) {
      toast.error('AI assistance is not available.');
      return;
    }

    const { isValid, complexity } = checkComplexity();
    if (!isValid) {
      toast.error(`Form is too complex for AI assistance (${complexity} components). Maximum allowed: ${limits.maxComplexity} components.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await aiService.requestAssistance(formId, versionId, {
        message: message.trim(),
        currentSchema,
      });

      setResponse(result);
      toast.success('AI assistance generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI assistance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (response?.schema) {
      onAccept(response.schema);
      toast.success('AI suggestion applied to your form!');
      handleClose();
    }
  };

  const handleReject = () => {
    setResponse(null);
    onReject();
    toast.info('AI suggestion rejected');
  };

  const handleClose = () => {
    setMessage('');
    setResponse(null);
    setError(null);
    onClose();
  };

  const { isValid: complexityValid, complexity } = checkComplexity();

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-dialog">
        <div className="ai-assistant-header">
          <div className="d-flex align-items-center">
            <Wand2 size={20} className="me-2 text-primary" />
            <h5 className="mb-0">AI Form Assistant</h5>
          </div>
          <Button variant="link" onClick={handleClose} className="p-0 text-muted">
            <X size={20} />
          </Button>
        </div>

        <div className="ai-assistant-body">
          {!limits?.aiEnabled && (
            <Alert variant="warning" className="mb-3">
              <AlertTriangle size={16} className="me-2" />
              AI assistance is not configured. Please contact your administrator.
            </Alert>
          )}

          {limits?.aiEnabled && !complexityValid && (
            <Alert variant="warning" className="mb-3">
              <AlertTriangle size={16} className="me-2" />
              Form is too complex for AI assistance ({complexity} components). 
              Maximum allowed: {limits.maxComplexity} components.
            </Alert>
          )}

          {error && (
            <Alert variant="danger" className="mb-3">
              <XCircle size={16} className="me-2" />
              {error}
            </Alert>
          )}

          {!response ? (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>What would you like to change or add to your form?</Form.Label>
                <Form.Control
                  as="textarea"
                  ref={textareaRef}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., Add an email field with validation, Create a contact information section, Add conditional logic to show/hide fields..."
                  disabled={isLoading || !limits?.aiEnabled || !complexityValid}
                  maxLength={1000}
                />
                <Form.Text className="text-muted">
                  {message.length}/1000 characters
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {limits && (
                    <>Current form complexity: {complexity}/{limits.maxComplexity} components</>
                  )}
                </small>
                <div>
                  <Button variant="outline-secondary" onClick={handleClose} className="me-2">
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isLoading || !message.trim() || !limits?.aiEnabled || !complexityValid}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} className="me-2" />
                        Get AI Suggestion
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Form>
          ) : (
            <div className="ai-response">
              {response.warnings && response.warnings.length > 0 && (
                <Alert variant="warning" className="mb-3">
                  <AlertTriangle size={16} className="me-2" />
                  <strong>Warning:</strong>
                  <ul className="mb-0 mt-2">
                    {response.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <div className="ai-explanation mb-4">
                <h6 className="text-success">
                  <CheckCircle size={16} className="me-2" />
                  AI Suggestion
                </h6>
                <div 
                  className="ai-markdown-content"
                  dangerouslySetInnerHTML={{ 
                    __html: response.markdown.replace(/\n/g, '<br>') 
                  }}
                />
              </div>

              <div className="ai-actions d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={handleReject}>
                  <XCircle size={16} className="me-2" />
                  Reject
                </Button>
                <div>
                  <Button variant="outline-primary" onClick={() => setResponse(null)} className="me-2">
                    Try Again
                  </Button>
                  <Button variant="success" onClick={handleAccept}>
                    <CheckCircle size={16} className="me-2" />
                    Accept & Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
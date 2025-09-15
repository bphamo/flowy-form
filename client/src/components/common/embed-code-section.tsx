import { Code, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Form, Row } from 'react-bootstrap';

interface EmbedCodeSectionProps {
  formId: number;
  formName: string;
}

export function EmbedCodeSection({ formId, formName }: EmbedCodeSectionProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'html' | 'react' | 'wordpress'>('html');
  const baseUrl = window.location.origin;

  const embedCodes = {
    html: `<!-- Embed ${formName} Form -->
<iframe 
  src="${baseUrl}/forms/${formId}/submit?embed=true"
  width="100%" 
  height="600"
  frameborder="0"
  scrolling="auto"
  style="border: 1px solid var(--bs-border-color); border-radius: 8px;">
</iframe>

<!-- With specific theme (optional) -->
<!-- Light theme: add &theme=light to URL -->
<!-- Dark theme: add &theme=dark to URL -->
<!-- System theme: add &theme=system to URL (default) -->`,

    react: `// React Component for ${formName}
function EmbeddedForm() {
  return (
    <iframe
      src="${baseUrl}/forms/${formId}/submit?embed=true"
      width="100%"
      height="600"
      frameBorder="0"
      scrolling="auto"
      style={{
        border: '1px solid var(--bs-border-color)',
        borderRadius: '8px'
      }}
      title="${formName} Form"
    />
  );
}

// With theme parameter (optional):
// &theme=light - Force light theme
// &theme=dark - Force dark theme  
// &theme=system - Use system preference (default)`,

    wordpress: `<!-- WordPress Shortcode for ${formName} -->
[iframe src="${baseUrl}/forms/${formId}/submit?embed=true" width="100%" height="600" scrolling="auto"]

<!-- Or use HTML block in Gutenberg editor -->
<iframe 
  src="${baseUrl}/forms/${formId}/submit?embed=true"
  width="100%" 
  height="600"
  frameborder="0"
  scrolling="auto"
  style="border: 1px solid var(--bs-border-color); border-radius: 8px;">
</iframe>

<!-- Theme options (add to URL):
&theme=light - Force light theme
&theme=dark - Force dark theme
&theme=system - Use system preference (default) -->`,
  };

  const returnEmbed = (type: 'html' | 'react' | 'wordpress') => {
    switch (type) {
      case 'html':
        return embedCodes.html;
      case 'react':
        return embedCodes.react;
      case 'wordpress':
        return embedCodes.wordpress;
      default:
        return '';
    }
  };

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
        <div className="d-flex align-items-center">
          <Code size={20} className="text-primary me-2" />
          <div>
            <h5 className="mb-0 fw-bold">Embed Form</h5>
            <small className="text-muted">Copy and paste these code snippets to embed your public form</small>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-4" >
        <Row className="g-4">
          {/* HTML */}
          <div className="border rounded p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <Form.Select
                className="me-2"
                aria-label="Default select example"
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value as 'html' | 'react' | 'wordpress')}
              >
                <option value="html">HTML</option>
                <option value="react">React</option>
                <option value="wordpress">WordPress</option>
              </Form.Select>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => copyToClipboard(returnEmbed(selectedTab), selectedTab)}
                className="d-flex align-items-center"
              >
                <Copy size={14} className="me-1" />
                {copied === selectedTab ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="p-2 rounded small" style={{ fontSize: '0.75rem', maxHeight: '400px', overflow: 'auto', backgroundColor: 'var(--bs-secondary-bg)' }}>
              <code>{returnEmbed(selectedTab)}</code>
            </pre>
          </div>
        </Row>

        {/* Usage Notes */}
        <div className="mt-4 p-3" style={{ backgroundColor: 'var(--bs-light-bg)', borderRadius: '0.375rem' }}>
          <h6 className="fw-bold mb-2">📝 Usage Notes</h6>
          <ul className="mb-0 small text-muted">
            <li>
              Forms are embedded with <code>?embed=true</code> parameter for minimal styling
            </li>
            <li>
              Optional theme parameter: <code>&theme=light</code>, <code>&theme=dark</code>, or <code>&theme=system</code> (default)
            </li>
            <li>Recommended iframe height is 600px, but adjust based on your form length</li>
            <li>Forms are responsive and will adapt to iframe width</li>
            <li>Only public forms can be embedded - private forms will show an error message</li>
            <li>Success pages will also be embedded when users submit the form</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
}

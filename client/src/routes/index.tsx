import { createFileRoute, Link } from '@tanstack/react-router';

import { ArrowRight, Check, GitBranch, GitCommit, GitCompare, Layers, MousePointer, Shield, Star, Users } from 'lucide-react';
import { Badge, Button, Card, Col, Container, Nav, Navbar, Row } from 'react-bootstrap';

export const Route = createFileRoute('/')({
  component: FlowyFormLanding,
});

function FlowyFormLanding() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #ebf4ff, #e0e7ff)' }}>
      <Header />
      <Hero />
      <Features />
      <GitWorkflow />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <Navbar bg="white" expand="md" className="border-bottom shadow-sm py-3">
      <Container>
        <Navbar.Brand className="d-flex align-items-center">
          <div
            style={{
              width: '2rem',
              height: '2rem',
              background: 'linear-gradient(to right, #2563eb, #4f46e5)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '0.5rem',
            }}
          >
            <Layers size={20} color="#fff" />
          </div>
          <strong style={{ color: 'var(--bs-body-color)' }}>Flowy Form</strong>
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <Nav.Link href="#features" className="text-muted">
              Features
            </Nav.Link>
            <Nav.Link href="#pricing" className="text-muted">
              Pricing
            </Nav.Link>
            <Nav.Link href="#docs" className="text-muted">
              Documentation
            </Nav.Link>
            <Link to="/auth/login" className="btn btn-outline-primary mx-2">
              Sign In
            </Link>
            <Link to="/auth/login" className="btn btn-primary">
              Get Started
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function Hero() {
  return (
    <section className="py-5 text-center">
      <Container>
        <Badge bg="secondary" className="mb-3 d-inline-flex align-items-center">
          <Star size={16} className="me-2" />
          Git-Powered Form Builder
        </Badge>
        <h1 className="display-4 fw-bold" style={{ color: 'var(--bs-body-color)' }}>
          Build Forms with{' '}
          <span style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Git-Like Versioning
          </span>
        </h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
          The first drag-and-drop form builder with complete version control. Create, commit, branch, and merge your forms just like code.
        </p>
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 my-4">
          <Button variant="primary" size="lg">
            Start Building Forms <ArrowRight size={20} className="ms-2" />
          </Button>
          <Button variant="outline-primary" size="lg">
            Watch Demo
          </Button>
        </div>
      </Container>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-5" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold" style={{ color: 'var(--bs-body-color)' }}>Powerful Features for Modern Form Development</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Everything you need to build, version, and deploy forms with confidence
          </p>
        </div>
        <Row className="g-4">
          {[
            {
              icon: <MousePointer size={32} className="text-primary mb-2" />,
              title: 'Drag & Drop Builder',
              desc: 'Intuitive visual form builder with pre-built components and custom styling options',
            },
            {
              icon: <GitCommit size={32} className="text-success mb-2" />,
              title: 'Version Control',
              desc: 'Commit your changes with descriptive messages and maintain a complete history',
            },
            {
              icon: <GitBranch size={32} className="text-purple mb-2" />,
              title: 'Branching & Merging',
              desc: 'Create feature branches, experiment safely, and merge changes seamlessly',
            },
            {
              icon: <GitCompare size={32} className="text-warning mb-2" />,
              title: 'Visual Diff',
              desc: 'Compare form versions side-by-side with highlighted changes and additions',
            },
            {
              icon: <Users size={32} className="text-info mb-2" />,
              title: 'Team Collaboration',
              desc: 'Work together with your team, review changes, and manage permissions',
            },
            {
              icon: <Shield size={32} className="text-danger mb-2" />,
              title: 'Rollback Protection',
              desc: 'Never lose work with instant rollbacks and comprehensive backup systems',
            },
          ].map(({ icon, title, desc }, idx) => (
            <Col md={4} key={idx}>
              <Card className="border-2 h-100 p-3 text-center">
                {icon}
                <Card.Title className="fw-bold">{title}</Card.Title>
                <Card.Text>{desc}</Card.Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

function GitWorkflow() {
  return (
    <section className="py-5" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold" style={{ color: 'var(--bs-body-color)' }}>Familiar Git Workflow</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Use the same version control concepts you know and love from software development
          </p>
        </div>
        <Row className="g-4 align-items-center">
          <Col lg={6}>
            {[
              {
                number: '1',
                bg: '#dbeafe',
                color: '#2563eb',
                title: 'Create & Edit',
                desc: 'Build your forms using our intuitive drag-and-drop interface with real-time preview',
              },
              {
                number: '2',
                bg: '#dcfce7',
                color: '#16a34a',
                title: 'Commit Changes',
                desc: 'Save your progress with meaningful commit messages and track every modification',
              },
              {
                number: '3',
                bg: '#ede9fe',
                color: '#7c3aed',
                title: 'Branch & Experiment',
                desc: 'Create feature branches to test new ideas without affecting your main form',
              },
              {
                number: '4',
                bg: '#ffedd5',
                color: '#ea580c',
                title: 'Merge & Deploy',
                desc: 'Review changes, merge approved features, and deploy with confidence',
              },
            ].map((step, idx) => (
              <div className="d-flex mb-4" key={idx}>
                <div
                  className="me-3 d-flex align-items-center justify-content-center rounded"
                  style={{ backgroundColor: step.bg, color: step.color, width: 48, height: 48, fontWeight: 600 }}
                >
                  {step.number}
                </div>
                <div>
                  <h5 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>{step.title}</h5>
                  <p className="text-muted mb-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </Col>
          <Col lg={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Recent Commits</h5>
                  <Badge bg="outline-secondary">main</Badge>
                </div>
                {[
                  { color: '#16a34a', text: 'Add email validation rules', time: '2 hours ago' },
                  { color: '#2563eb', text: 'Update submit button styling', time: '1 day ago' },
                  { color: '#7c3aed', text: 'Merge feature/multi-step-form', time: '3 days ago' },
                ].map((commit, idx) => (
                  <div key={idx} className="d-flex align-items-center p-2 mb-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="me-3" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: commit.color }} />
                    <div>
                      <div className="fw-medium small" style={{ color: 'var(--bs-body-color)' }}>{commit.text}</div>
                      <div className="text-muted small">{commit.time}</div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-5" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold" style={{ color: 'var(--bs-body-color)' }}>Simple, Transparent Pricing</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Choose the plan that fits your team's needs
          </p>
        </div>
        <Row className="g-4 justify-content-center">
          {[
            {
              title: 'Starter',
              price: '$0',
              description: 'Perfect for individuals and small projects',
              features: ['Up to 3 forms', 'Basic version control', '100 submissions/month'],
              button: 'Get Started',
              variant: 'outline-primary',
            },
            {
              title: 'Professional',
              price: '$29',
              description: 'For growing teams and businesses',
              features: ['Unlimited forms', 'Advanced branching', '10,000 submissions/month', 'Team collaboration'],
              button: 'Start Free Trial',
              variant: 'primary',
              highlight: true,
            },
            {
              title: 'Enterprise',
              price: 'Custom',
              description: 'For large organizations',
              features: ['Everything in Professional', 'SSO integration', 'Priority support', 'Custom integrations'],
              button: 'Contact Sales',
              variant: 'outline-primary',
            },
          ].map((plan, idx) => (
            <Col md={4} key={idx}>
              <Card className={`h-100 ${plan.highlight ? 'border-primary' : 'border'}`}>
                {plan.highlight && (
                  <Badge bg="primary" className="position-absolute top-0 start-50 translate-middle-x" style={{ transform: 'translateY(-50%)' }}>
                    Most Popular
                  </Badge>
                )}
                <Card.Body className="text-center">
                  <Card.Title className="fs-4 fw-bold">{plan.title}</Card.Title>
                  <div className="fs-2 fw-bold" style={{ color: 'var(--bs-body-color)' }}>
                    {plan.price}
                    {plan.price !== 'Custom' && <span className="fs-6 text-muted">/month</span>}
                  </div>
                  <Card.Text className="text-muted mb-4">{plan.description}</Card.Text>
                  <ul className="list-unstyled text-start mb-4">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="mb-2 d-flex align-items-center">
                        <Check size={16} className="text-success me-2" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.variant} className="w-100">
                    {plan.button}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-5 text-center" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}>
      <Container>
        <h2 className="display-5 fw-bold text-white mb-3">Ready to revolutionize your form building?</h2>
        <p className="lead text-white-50 mb-4 mx-auto" style={{ maxWidth: '700px' }}>
          Join thousands of developers who are already using git-like versioning for their forms
        </p>
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <Button variant="light" size="lg">
            Start Free Trial <ArrowRight size={20} className="ms-2" />
          </Button>
          <Button variant="outline-light" size="lg">
            Schedule Demo
          </Button>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-dark text-white py-5">
      <Container>
        <Row>
          <Col md={3} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={20} color="#fff" />
              </div>
              <strong className="ms-2">Flowy Form</strong>
            </div>
            <p className="text-white">The first form builder with git-like version control for modern development teams.</p>
          </Col>

          <Col md={3} className="mb-4">
            <h5 className="fw-bold mb-3">Product</h5>
            <ul className="list-unstyled text-white">
              {['Features', 'Pricing', 'Documentation', 'API'].map((item, idx) => (
                <li key={idx} className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </Col>

          <Col md={3} className="mb-4">
            <h5 className="fw-bold mb-3">Company</h5>
            <ul className="list-unstyled text-white">
              {['About', 'Blog', 'Careers', 'Contact'].map((item, idx) => (
                <li key={idx} className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </Col>

          <Col md={3} className="mb-4">
            <h5 className="fw-bold mb-3">Support</h5>
            <ul className="list-unstyled text-white">
              {['Help Center', 'Community', 'Status', 'Security'].map((item, idx) => (
                <li key={idx} className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </Col>
        </Row>
        <div className="text-center text-white mt-4 border-top pt-3">&copy; {new Date().getFullYear()} Flowy Form. All rights reserved.</div>
      </Container>
    </footer>
  );
}

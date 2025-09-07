import { createFileRoute } from '@tanstack/react-router';

import { PageHeader } from '@/components/common/page-header';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { requireAuth } from '@/lib/auth-utils';
import { type BreadcrumbItem } from '@/types';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { Button, Card, Container } from 'react-bootstrap';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Appearance settings',
    href: '/settings/appearance',
  },
];

function SettingsAppearance() {
  const { appearance, updateAppearance } = useAppearance();

  const handleThemeChange = (theme: Appearance) => {
    updateAppearance(theme);
  };

  const themes = [
    {
      id: 'light' as Appearance,
      name: 'Light Theme',
      description: 'Bright and clean interface',
      icon: Sun,
      iconBg: 'var(--bs-primary-bg-subtle)',
      iconColor: 'text-primary',
    },
    {
      id: 'dark' as Appearance,
      name: 'Dark Theme',
      description: 'Easy on the eyes',
      icon: Moon,
      iconBg: 'var(--bs-gray-100)',
      iconColor: 'text-muted',
    },
    {
      id: 'system' as Appearance,
      name: 'Auto',
      description: 'Matches system settings',
      icon: Monitor,
      iconBg: 'var(--bs-gray-100)',
      iconColor: 'text-muted',
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, var(--bs-primary-bg-subtle), var(--bs-body-bg))' }}>
        <Container className="py-5">
          <PageHeader
            badge={{ icon: Palette, text: 'Appearance Settings' }}
            title="Customize Your Experience"
            description="Personalize your interface with themes and appearance preferences"
          />

          <SettingsLayout>
            <Card className="shadow-sm border-0">
              <Card.Header className="py-3" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                <div className="d-flex align-items-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
                    style={{ width: 40, height: 40, backgroundColor: 'var(--bs-info-bg-subtle)' }}
                  >
                    <Palette size={20} className="text-purple" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">Theme Preferences</h5>
                    <p className="text-muted small mb-0">Choose your preferred color scheme</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex flex-column gap-4">
                  <div className="d-flex gap-3">
                    {themes.map((theme) => {
                      const Icon = theme.icon;
                      const isActive = appearance === theme.id;

                      return (
                        <Card key={theme.id} className={`border-2 ${isActive ? 'border-primary' : 'border'}`} style={{ width: '200px' }}>
                          <Card.Body className="p-3 text-center">
                            <div
                              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                              style={{ width: 40, height: 40, backgroundColor: theme.iconBg }}
                            >
                              <Icon size={20} className={theme.iconColor} />
                            </div>
                            <h6 className="fw-bold mb-1">{theme.name}</h6>
                            <p className="text-muted small mb-2">{theme.description}</p>
                            <Button
                              variant={isActive ? 'primary' : 'outline-secondary'}
                              size="sm"
                              className="w-100"
                              onClick={() => handleThemeChange(theme.id)}
                            >
                              {isActive ? 'Active' : 'Select'}
                            </Button>
                          </Card.Body>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--bs-gray-100)' }}>
                    <h6 className="fw-semibold mb-2">Coming Soon</h6>
                    <p className="text-muted small mb-0">
                      Additional appearance customization options including custom colors, fonts, and layouts will be available in future updates.
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </SettingsLayout>
        </Container>
      </div>
    </AppLayout>
  );
}

export const Route = createFileRoute('/settings/appearance')({
  beforeLoad: ({ context }) => {
    requireAuth(context, '/settings/appearance');
  },
  loader: async () => {
    try {
      const response = await fetch('/api/user/appearance', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return { appearance: data.data || data };
      } else {
        // Return default appearance settings
        return {
          appearance: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
          },
        };
      }
    } catch (error) {
      console.error('Error fetching appearance settings:', error);
      return {
        appearance: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
        },
      };
    }
  },
  component: SettingsAppearance,
});

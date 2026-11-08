'use client';

import { api } from '@/trpc/react';
import { Check, Database, KeyRound, Server, ShieldCheck } from 'lucide-react';
import s from './admin.module.css';
import { Panel, QueryState } from './shared';

export function System({ demo }: { demo: boolean }) {
  const query = api.admin.system.useQuery(undefined, { enabled: !demo });
  const data = demo
    ? {
        database: true,
        adminCount: 2,
        environment: 'development',
        services: [
          {
            name: 'Authentication',
            description: 'Better Auth · session-based access',
            configured: true,
          },
          {
            name: 'Cache & rate limiting',
            description: 'Upstash Redis',
            configured: true,
          },
          {
            name: 'Payments',
            description: 'Polar · subscription webhooks',
            configured: true,
          },
          {
            name: 'Transactional email',
            description: 'Resend',
            configured: true,
          },
          {
            name: 'Image storage',
            description: 'Vercel Blob',
            configured: true,
          },
          {
            name: 'AI generation',
            description: 'AI Gateway',
            configured: true,
          },
          {
            name: 'Custom domains',
            description: 'Vercel domain management',
            configured: false,
          },
        ],
      }
    : query.data;
  if (!data) {
    return (
      <QueryState
        loading={query.isPending}
        error={query.error?.message}
        retry={() => query.refetch()}
      />
    );
  }
  return (
    <>
      <div className={s.systemMetrics}>
        <div className={s.systemMetric}>
          <Database size={20} />
          <div>
            <span>Database</span>
            <strong>
              {demo ? 'Preview connection' : 'Connection verified'}
            </strong>
          </div>
          <span className={s.serviceDot} />
        </div>
        <div className={s.systemMetric}>
          <ShieldCheck size={20} />
          <div>
            <span>Administrator access</span>
            <strong>{data.adminCount} allowlisted accounts</strong>
          </div>
        </div>
        <div className={s.systemMetric}>
          <Server size={20} />
          <div>
            <span>Environment</span>
            <strong className={s.capitalize}>{data.environment}</strong>
          </div>
        </div>
      </div>
      <div className={s.bottomGrid}>
        <Panel
          title="Services"
          description="Configuration presence only; external service availability is not probed."
        >
          <div className={s.services}>
            {data.services.map((service) => (
              <div key={service.name}>
                <span className={s.serviceIcon}>
                  <Server size={17} />
                </span>
                <div>
                  <strong>{service.name}</strong>
                  <small>{service.description}</small>
                </div>
                <span className={s.status} data-active={service.configured}>
                  {service.configured ? (
                    <Check size={12} />
                  ) : (
                    <span className={s.smallDot} />
                  )}
                  {service.configured ? 'Configured' : 'Not configured'}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Administrator access"
          description="Server-side permissions for your control room"
        >
          <div className={s.accessNotes}>
            <KeyRound size={28} strokeWidth={1.3} />
            <h3>Manage admin access</h3>
            <p>
              Admin access is granted through the <code>ADMIN_USER_IDS</code>{' '}
              server environment variable. Add existing user IDs, separated by
              commas, and redeploy.
            </p>
            <p>
              Every admin API independently validates the authenticated user
              against this allowlist. No browser setting can grant access.
            </p>
            <div>
              <ShieldCheck size={16} />
              <span>
                Session revocation is blocked for administrator accounts.
              </span>
            </div>
            <small>
              Environment values and service credentials are never returned to
              this panel.
            </small>
          </div>
        </Panel>
      </div>
    </>
  );
}

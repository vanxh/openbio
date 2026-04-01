import { env } from '@/env.mjs';

const VERCEL_API = 'https://api.vercel.com';

function getHeaders() {
  return {
    Authorization: `Bearer ${env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function getTeamParam() {
  return env.VERCEL_TEAM_ID ? `?teamId=${env.VERCEL_TEAM_ID}` : '';
}

function isConfigured() {
  return !!(env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID);
}

export async function addDomainToVercel(domain: string) {
  if (!isConfigured()) {
    return { success: true, skipped: true };
  }

  const res = await fetch(
    `${VERCEL_API}/v10/projects/${env.VERCEL_PROJECT_ID}/domains${getTeamParam()}`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  );

  const data = (await res.json()) as {
    name?: string;
    error?: { code: string; message: string };
  };

  if (!res.ok) {
    // Domain already exists on the project — treat as success
    if (data.error?.code === 'domain_already_in_use') {
      return { success: true };
    }
    throw new Error(data.error?.message ?? 'Failed to add domain to Vercel');
  }

  return { success: true };
}

export async function removeDomainFromVercel(domain: string) {
  if (!isConfigured()) {
    return { success: true, skipped: true };
  }

  const res = await fetch(
    `${VERCEL_API}/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}${getTeamParam()}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    const data = (await res.json()) as {
      error?: { code: string; message: string };
    };
    // Domain not found — already removed, treat as success
    if (data.error?.code === 'not_found') {
      return { success: true };
    }
    throw new Error(
      data.error?.message ?? 'Failed to remove domain from Vercel'
    );
  }

  return { success: true };
}

export async function getDomainConfig(domain: string) {
  if (!isConfigured()) {
    return null;
  }

  const res = await fetch(
    `${VERCEL_API}/v6/domains/${domain}/config${getTeamParam()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as {
    configuredBy: string | null;
    misconfigured: boolean;
  };
}

export async function verifyDomain(domain: string) {
  if (!isConfigured()) {
    return null;
  }

  const res = await fetch(
    `${VERCEL_API}/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}/verify${getTeamParam()}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as {
    name: string;
    verified: boolean;
    verification?: Array<{ type: string; domain: string; value: string }>;
  };
}

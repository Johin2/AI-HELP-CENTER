import { NextResponse } from 'next/server';
import { z } from 'zod';

import { githubApp, repositoryIndexService } from '@/lib/server/runtime.js';

export const dynamic = 'force-dynamic';

const toggleSchema = z.object({
  repository_id: z.number().int(),
  enabled: z.boolean(),
});

const parseInstallationId = (value) => {
  const id = Number(value);
  if (!Number.isFinite(id)) {
    throw new Error('Invalid installation id.');
  }
  return id;
};

export async function GET(request, { params }) {
  if (!githubApp.isConfigured()) {
    return NextResponse.json({ error: 'GitHub App not configured.' }, { status: 503 });
  }

  try {
    const installationId = parseInstallationId(params.installationId);
    const repositories = await repositoryIndexService.listRepositories(installationId);
    return NextResponse.json({ repositories });
  } catch (error) {
    console.error('Failed to list installation repositories:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  if (!githubApp.isConfigured()) {
    return NextResponse.json({ error: 'GitHub App not configured.' }, { status: 503 });
  }

  try {
    const installationId = parseInstallationId(params.installationId);
    const payload = toggleSchema.parse(await request.json());
    await repositoryIndexService.setRepositoryEnabled({
      installationId,
      repositoryId: payload.repository_id,
      enabled: payload.enabled,
    });

    const repositories = await repositoryIndexService.listRepositories(installationId);
    return NextResponse.json({ repositories });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 500;
    console.error('Failed to update repository toggle:', error);
    return NextResponse.json({ error: error.message ?? 'Failed to update repository toggle.' }, { status });
  }
}


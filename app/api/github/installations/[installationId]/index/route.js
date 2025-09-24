import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { z } from 'zod';

import { githubApp, repositoryIndexService } from '@/lib/server/runtime.js';

export const dynamic = 'force-dynamic';

const indexSchema = z.object({
  repository_ids: z.array(z.number().int()).optional(),
});

const parseInstallationId = (value) => {
  const id = Number(value);
  if (!Number.isFinite(id)) {
    throw new Error('Invalid installation id.');
  }
  return id;
};

export async function POST(request, { params }) {
  if (!githubApp.isConfigured()) {
    return NextResponse.json({ error: 'GitHub App not configured.' }, { status: 503 });
  }

  try {
    const installationId = parseInstallationId(params.installationId);
    const payload = indexSchema.parse(await request.json());
    const octokit = await githubApp.getInstallationOctokit(installationId);

    let repositoryIds = payload.repository_ids;

    if (!repositoryIds || repositoryIds.length === 0) {
      const accessible = await githubApp.listInstallationRepositories(installationId);
      repositoryIds = accessible.map((repo) => repo.id);
    }

    const limit = pLimit(3);
    const repositories = await Promise.all(
      repositoryIds.map((repositoryId) =>
        limit(async () => {
          const { data } = await octokit.request('GET /repositories/{repository_id}', {
            repository_id: repositoryId,
          });
          return data;
        }),
      ),
    );

    const results = [];
    for (const repo of repositories) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await repositoryIndexService.indexRepository(installationId, repo);
        results.push({ repository_id: repo.id, status: 'indexed', chunks: result.chunks });
      } catch (error) {
        console.error('Failed to index repository:', repo.full_name, error);
        results.push({ repository_id: repo.id, status: 'failed', error: error.message });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 500;
    console.error('Failed to trigger repository indexing:', error);
    return NextResponse.json({ error: error.message ?? 'Indexing request failed.' }, { status });
  }
}


import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { handleDatasetUpload } from '@/lib/server/datasets';
import { datasetStore, knowledgeReady, retriever, supabaseKnowledgeBase } from '@/lib/server/runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await knowledgeReady;
    const result = await handleDatasetUpload(payload, {
      retriever,
      datasetStore,
      supabaseKnowledgeBase,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid dataset payload.',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Unexpected error while handling /api/datasets request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { handleAskRequest } from '@/lib/server/ask.js';
import { geminiClient, knowledgeReady, retriever } from '@/lib/server/runtime.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json();
    await knowledgeReady;
    const result = await handleAskRequest(payload, { client: geminiClient, retriever });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request payload.',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Unexpected error while handling /api/ask request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

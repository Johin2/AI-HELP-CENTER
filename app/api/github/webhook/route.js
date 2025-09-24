import { NextResponse } from 'next/server';

import { githubApp } from '@/lib/server/runtime.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!githubApp.isConfigured()) {
    return NextResponse.json({ error: 'GitHub App not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');
  const delivery = request.headers.get('x-github-delivery');
  const payload = await request.text();

  if (!signature || !event || !delivery) {
    return NextResponse.json({ error: 'Missing GitHub webhook headers.' }, { status: 400 });
  }

  try {
    await githubApp.verifyWebhook({
      id: delivery,
      name: event,
      signature256: signature,
      payload,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('GitHub webhook verification failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }
}


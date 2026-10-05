import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'property-vision', version: '0.1.1', timestamp: new Date().toISOString() });
}

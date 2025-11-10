import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { ironOptions, type SessionData } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await getIronSession<SessionData>(cookies(), ironOptions);
  session.destroy();
  return NextResponse.json({ message: 'Logged out' });
}

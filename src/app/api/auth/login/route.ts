import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { findUserByUsername } from '@/lib/services/userService';
import { ironOptions, type SessionData } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await findUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await getIronSession<SessionData>(cookies(), ironOptions);
    session.username = user.username;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

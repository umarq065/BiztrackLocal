import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { findUserByUsername, seedInitialUser } from '@/lib/services/userService';
import { ironOptions, type SessionData } from '@/lib/session';
import { NextResponse } from 'next/server';

// Ensure the initial user exists before any login attempt.
// This is a simple way to seed the database for development.
// In a production environment, you would have a more formal migration/seeding process.
if (process.env.NODE_ENV === 'development') {
    seedInitialUser();
}

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

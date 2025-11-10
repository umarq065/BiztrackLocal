import { sessionOptions } from 'iron-session/next';

export interface SessionData {
  username: string;
  isLoggedIn: boolean;
}

export const ironOptions = {
  cookieName: 'biztrack_pro_session',
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

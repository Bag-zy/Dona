import { auth } from '@/lib/auth/server';

export default auth.middleware();

export const config = {
  matcher: [
    // Protected routes requiring authentication
    '/admin/:path*',
    '/account/:path*',
    '/api/categories/:path*',
    '/api/tags/:path*',
    '/api/users/:path*',
    '/api/comments/:path*',
    '/api/newsletter/:path*',
    '/api/media/:path*',
    '/api/settings/:path*',
    '/api/posts/:path*',
  ],
};

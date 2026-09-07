import { NextResponse } from 'next/server';

export function middleware(request) {
  const userId = request.cookies.get('userId')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/logout'];
  if (publicPaths.includes(pathname)) {
    if (userId && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  // A lógica de autenticação foi temporariamente desativada para permitir o desenvolvimento.
  // Para reativar, descomente o bloco abaixo.
  /*
  const PROTECTED_ROUTES = ['/'];
  const PUBLIC_ROUTES = ['/login'];

  const { pathname } = request.nextUrl;
  
  const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.includes('firebase:authUser'));

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !PUBLIC_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (!hasAuthCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (hasAuthCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};

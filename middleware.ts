
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/']; // A rota raiz e tudo dentro dela
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (!sessionCookie && isProtectedRoute && !isPublicRoute) {
    // Se não há sessão e a rota é protegida, redireciona para o login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (sessionCookie && isPublicRoute) {
    // Se há sessão e o usuário tenta acessar uma rota pública (como /login), redireciona para a home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica o middleware a todas as rotas, exceto arquivos estáticos e rotas de API
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};

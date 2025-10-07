
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // O Firebase Auth no cliente usa um cookie com um nome complexo
  // que geralmente começa com "firebase:authUser".
  // Em vez de procurar um cookie 'session' específico, vamos verificar
  // se *qualquer* cookie que indique um usuário do Firebase existe.
  const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.includes('firebase:authUser'));

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !PUBLIC_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Se não há cookie de autenticação e a rota é protegida, redireciona para o login
  if (!hasAuthCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Se há cookie de autenticação e o usuário tenta acessar uma rota pública (como /login), redireciona para a home
  if (hasAuthCookie && isPublicRoute) {
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

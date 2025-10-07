
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !PUBLIC_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Se não há cookie de sessão e a rota é protegida, redireciona para o login
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Se há cookie de sessão e o usuário tenta acessar uma rota pública (como /login), redireciona para a home
  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nenhuma verificação do cookie é feita aqui no middleware.
  // A verificação será feita nas páginas/componentes do servidor que precisam de dados do usuário
  // ou em API routes. Para um app PWA que funciona offline, manter o middleware simples
  // é uma abordagem mais resiliente. A validação real da sessão ocorre quando
  // dados sensíveis são solicitados.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica o middleware a todas as rotas, exceto arquivos estáticos e rotas de API
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};

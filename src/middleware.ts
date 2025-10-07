
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Esta lógica de inicialização do Admin SDK deve ser consistente com as suas rotas de API
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!, 'base64').toString('utf-8')
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (e) {
    console.error('Firebase Admin Initialization Error in Middleware:', e);
  }
}


const PROTECTED_ROUTES = ['/'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !PUBLIC_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionCookie) {
    try {
      // Verificar o cookie de sessão com o Firebase Admin
      const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
      
      // Se o usuário está logado e tenta acessar uma rota pública (como /login), redireciona para a home
      if (isPublicRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Adicione aqui futuras verificações de nível de acesso se necessário
      // Ex: if (decodedClaims.admin !== true && pathname.startsWith('/admin')) { ... }

    } catch (error) {
      // Cookie inválido ou expirado, limpa o cookie e redireciona para o login
      console.error('Session cookie verification failed:', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica o middleware a todas as rotas, exceto arquivos estáticos e rotas de API
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};

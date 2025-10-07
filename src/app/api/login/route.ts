
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Decodifique a chave de serviço que está em uma variável de ambiente
// Esta chave deve ser configurada nas variáveis de ambiente do seu provedor de hosting (ex: Vercel, Firebase Hosting)
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount;

if (serviceAccountKey) {
  try {
    serviceAccount = JSON.parse(
      Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
    );
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  }
}


// Inicialize o Firebase Admin SDK se ainda não foi inicializado
if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function POST(request: Request) {
  if (!serviceAccount) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set or is invalid. Cannot create session cookie.");
    return NextResponse.json({ error: 'Server not configured for authentication.' }, { status: 500 });
  }

  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias em milissegundos

  try {
    const decodedIdToken = await getAuth().verifyIdToken(idToken);
    
    // Se for a primeira vez que um usuário está logando (ou se não tiver claims), defina-o como admin.
    // Esta é uma lógica de bootstrap para o primeiro usuário.
    // REMOVA OU PROTEJA ESTA LÓGICA EM PRODUÇÃO APÓS O PRIMEIRO LOGIN DO ADMIN.
    if (Object.keys(decodedIdToken.customClaims || {}).length === 0) {
        await getAuth().setCustomUserClaims(decodedIdToken.uid, { admin: true });
    }

    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);

    return response;

  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}


'use client';

import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';
import Image from 'next/image';

export default function PendingScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 text-center p-6 space-y-8">
            <div className="flex items-center gap-3 mb-4">
                <Image
                    src="/logo.png"
                    alt="Synergia OS Logo"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md"
                />
                <h1 className="text-3xl font-bold font-headline text-foreground">
                    Synergia OS
                </h1>
            </div>

            <div className="flex flex-col items-center space-y-6 max-w-md bg-background p-8 rounded-xl shadow-lg border">
                <div className="p-4 rounded-full bg-primary/10 animate-pulse">
                    <Clock className="h-12 w-12 text-primary" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Aguardando Aprovação</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Sua conta foi criada com sucesso! Por segurança, um administrador precisa aprovar seu acesso antes que você possa visualizar os dados da empresa.
                    </p>
                </div>

                <div className="w-full pt-4">
                    <Button
                        variant="outline"
                        onClick={() => signOut(firebaseAuth)}
                        className="w-full gap-2 h-11"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair do Sistema
                    </Button>
                </div>

                <div className="pt-2 text-xs text-muted-foreground border-t w-full flex flex-col gap-1">
                    <p className="italic">Assim que seu acesso for aprovado, você poderá entrar normalmente.</p>
                    <p className="font-medium">Obrigado pela paciência!</p>
                </div>
            </div>

            <div className="text-xs text-muted-foreground">
                Synergia OS &copy; {new Date().getFullYear()} - Todos os direitos reservados.
            </div>
        </div>
    );
}

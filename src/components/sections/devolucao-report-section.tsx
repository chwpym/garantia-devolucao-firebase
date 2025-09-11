'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DevolucaoReportSection() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios de Devoluções</h1>
                <p className="text-lg text-muted-foreground">
                    Analise os dados de devoluções registradas no sistema.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Em Construção</CardTitle>
                    <CardDescription>
                        Esta seção está sendo preparada. Em breve, você poderá visualizar relatórios detalhados sobre as devoluções.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Volte em breve!</p>
                </CardContent>
            </Card>
        </div>
    );
}

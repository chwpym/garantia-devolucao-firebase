'use client';

import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { ImportButton } from '@/components/import-button';


export default function BackupSection() {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
        await db.initDB();
        const warranties = await db.getAllWarranties();
        const dataStr = JSON.stringify(warranties, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const linkElement = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `backup_garantias_${date}.json`);
        linkElement.click();
        
        toast({
            title: "Exportação Concluída",
            description: "Seus dados foram exportados para um arquivo JSON."
        });
    } catch (error) {
        console.error("Failed to export data:", error);
        toast({
            title: "Erro na Exportação",
            description: "Não foi possível exportar os dados. Tente novamente.",
            variant: "destructive"
        });
    }
  };

  const handleDataImported = () => {
    toast({
      title: "Importação Concluída",
      description: "Seus dados foram importados com sucesso. Os dados nas outras seções serão atualizados."
    });
    // Fire an event to notify other components that data has changed.
    window.dispatchEvent(new CustomEvent('datachanged'));
  }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup e Restauração</h1>
            <p className="text-lg text-muted-foreground">
                Gerencie os dados da sua aplicação.
            </p>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Gerenciamento de Dados</CardTitle>
                <CardDescription>
                    Faça o backup (exportação) ou restaure (importação) seus dados a partir de um arquivo JSON. A importação substituirá todos os dados existentes.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar para JSON
                </Button>
                <ImportButton onDataImported={handleDataImported} />
            </CardContent>
        </Card>
    </div>
  );
}

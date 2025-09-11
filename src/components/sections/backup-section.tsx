'use client';

import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { ImportButton } from '@/components/import-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CsvExporter from '../csv-exporter';

interface FullBackupData {
  warranties: Awaited<ReturnType<typeof db.getAllWarranties>>;
  persons: Awaited<ReturnType<typeof db.getAllPersons>>;
  suppliers: Awaited<ReturnType<typeof db.getAllSuppliers>>;
  lotes: Awaited<ReturnType<typeof db.getAllLotes>>;
  devolucoes: Awaited<ReturnType<typeof db.getAllDevolucoes>>;
  companyData: Awaited<ReturnType<typeof db.getCompanyData>>;
}


export default function BackupSection() {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
        await db.initDB();
        
        const [
            warranties,
            persons,
            suppliers,
            lotes,
            devolucoes,
            companyData
        ] = await Promise.all([
            db.getAllWarranties(),
            db.getAllPersons(),
            db.getAllSuppliers(),
            db.getAllLotes(),
            db.getAllDevolucoes(),
            db.getCompanyData()
        ]);
        
        const fullBackup: FullBackupData = {
            warranties,
            persons,
            suppliers,
            lotes,
            devolucoes,
            companyData
        };

        const dataStr = JSON.stringify(fullBackup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const linkElement = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `backup_total_warrantywise_${date}.json`);
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
      description: "Seus dados foram importados com sucesso. As outras seções serão atualizadas."
    });
    // Fire an event to notify other components that data has changed.
    window.dispatchEvent(new CustomEvent('datachanged'));
  }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup e Exportação</h1>
            <p className="text-lg text-muted-foreground">
                Gerencie os dados da sua aplicação com backups completos ou exportações personalizadas.
            </p>
        </div>
        
        <Tabs defaultValue="backup-restore">
            <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="backup-restore">Backup / Restore (JSON)</TabsTrigger>
                <TabsTrigger value="export-csv">Exportação Avançada (CSV)</TabsTrigger>
            </TabsList>
            <TabsContent value="backup-restore">
                <Card className="shadow-lg mt-4">
                    <CardHeader>
                        <CardTitle>Backup e Restauração Completa</CardTitle>
                        <CardDescription>
                            Faça o backup (exportação) de <span className='font-bold'>todos os dados</span> do sistema para um único arquivo JSON.
                            A importação <span className='font-bold text-destructive'>substituirá todos os dados existentes</span>. Use com cuidado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <Button onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Backup Completo
                        </Button>
                        <ImportButton onDataImported={handleDataImported} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="export-csv">
                <Card className="shadow-lg mt-4">
                    <CardHeader>
                        <CardTitle>Exportação Personalizada para CSV</CardTitle>
                        <CardDescription>
                            Selecione um tipo de dado e os campos que deseja exportar para um arquivo CSV. Ideal para relatórios ou análises externas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CsvExporter />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, UploadCloud, Loader2 } from 'lucide-react';
import { ImportButton } from '@/components/import-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CsvExporter from '../csv-exporter';
import { uploadFile } from '@/lib/storage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface FullBackupData {
  warranties: Awaited<ReturnType<typeof db.getAllWarranties>>;
  persons: Awaited<ReturnType<typeof db.getAllPersons>>;
  suppliers: Awaited<ReturnType<typeof db.getAllSuppliers>>;
  lotes: Awaited<ReturnType<typeof db.getAllLotes>>;
  devolucoes: Awaited<ReturnType<typeof db.getAllDevolucoes>>;
  companyData: Awaited<ReturnType<typeof db.getCompanyData>>;
  products: Awaited<ReturnType<typeof db.getAllProducts>>;
}


export default function BackupSection() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const gatherDataForBackup = async (): Promise<FullBackupData> => {
    await db.initDB();
    
    const [
        warranties,
        persons,
        suppliers,
        lotes,
        devolucoes,
        companyData,
        products
    ] = await Promise.all([
        db.getAllWarranties(),
        db.getAllPersons(),
        db.getAllSuppliers(),
        db.getAllLotes(),
        db.getAllDevolucoes(),
        db.getCompanyData(),
        db.getAllProducts()
    ]);
    
    return {
        warranties,
        persons,
        suppliers,
        lotes,
        devolucoes,
        companyData,
        products
    };
  }

  const handleLocalExport = async () => {
    try {
        const fullBackup = await gatherDataForBackup();

        const dataStr = JSON.stringify(fullBackup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const linkElement = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `backup_synergia_os_${date}.json`);
        linkElement.click();
        
        toast({
            title: "Exportação Concluída",
            description: "Seus dados foram exportados para um arquivo JSON local."
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

  const handleCloudExport = async () => {
    setIsUploading(true);
    // Temporarily disabled to avoid CORS issues on Spark plan
    toast({
        title: 'Funcionalidade Indisponível no Plano Gratuito',
        description: 'O backup na nuvem requer o plano pago (Blaze) do Firebase para remover as restrições de rede.',
        variant: 'destructive',
        duration: 8000,
    });
    setIsUploading(false);
    return;
    
    /*
    try {
      const fullBackup = await gatherDataForBackup();
      const dataStr = JSON.stringify(fullBackup, null, 2);
      const backupBlob = new Blob([dataStr], { type: 'application/json' });
      
      const date = new Date().toISOString().split('T')[0];
      const fileName = `backup_synergia_os_${date}.json`;
      const filePath = `backups/${fileName}`;

      await uploadFile(backupBlob, filePath);

      toast({
        title: "Backup na Nuvem Concluído",
        description: `O arquivo ${fileName} foi salvo com sucesso no Firebase Storage.`,
      });

    } catch (error) {
      console.error("Failed to upload backup:", error);
      toast({
          title: "Erro no Backup para Nuvem",
          description: "Não foi possível salvar o backup no Firebase Storage.",
          variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
    */
  }


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
                            Faça o backup (exportação) de <span className='font-bold'>todos os dados</span> do sistema para um único arquivo JSON, salvando-o localmente.
                            A importação <span className='font-bold text-destructive'>substituirá todos os dados existentes</span>. Use com cuidado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <Button onClick={handleLocalExport} disabled={isUploading}>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar Backup Local
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button variant="secondary" disabled={true}>
                                  <UploadCloud className="mr-2 h-4 w-4" />
                                  Salvar Backup na Nuvem
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Requer o plano Blaze (pago) do Firebase.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

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

'use client';

import { useEffect, useState, useCallback } from 'react';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Pencil, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import StatusForm from '@/components/status-form';
import type { CustomStatus } from '@/lib/types';
import { useAppStore, type AppState } from '@/store/app-store';

export default function StatusSection() {
    const { toast } = useToast();

    // --- Status Management Logic ---
    const [statuses, setStatuses] = useState<CustomStatus[]>([]);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CustomStatus | null>(null);


    const loadStatuses = useCallback(async () => {
        // --- Default Statuses Migration ---
        const defaultStatuses: CustomStatus[] = [
            // Garantias
            { nome: 'Aguardando Envio', cor: '#F59E0B', aplicavelEm: ['garantia'] },
            { nome: 'Enviado para Análise', cor: '#3B82F6', aplicavelEm: ['garantia'] },
            { nome: 'Aprovada - Peça Nova', cor: '#10B981', aplicavelEm: ['garantia'] },
            { nome: 'Aprovada - Crédito NF', cor: '#8B5CF6', aplicavelEm: ['garantia'] },
            { nome: 'Aprovada - Crédito Boleto', cor: '#10B981', aplicavelEm: ['garantia'] },
            { nome: 'Recusada', cor: '#EF4444', aplicavelEm: ['garantia'] },

            // Lotes
            { nome: 'Aberto', cor: '#6B7280', aplicavelEm: ['lote'] },
            { nome: 'Enviado', cor: '#3B82F6', aplicavelEm: ['lote'] },
            { nome: 'Aprovado Parcialmente', cor: '#10B981', aplicavelEm: ['lote'] },
            { nome: 'Aprovado Totalmente', cor: '#059669', aplicavelEm: ['lote'] },
            { nome: 'Recusado', cor: '#EF4444', aplicavelEm: ['lote'] },

            // Devoluções
            { nome: 'Recebido', cor: '#6B7280', aplicavelEm: ['devolucao'] },
            { nome: 'Aguardando Peças', cor: '#F59E0B', aplicavelEm: ['devolucao'] },
            { nome: 'Finalizada', cor: '#10B981', aplicavelEm: ['devolucao'] },
            { nome: 'Cancelada', cor: '#EF4444', aplicavelEm: ['devolucao'] },

            // Ação Requisição
            { nome: 'Alterada', cor: '#3B82F6', aplicavelEm: ['acaoRequisicao'] },
            { nome: 'Excluída', cor: '#EF4444', aplicavelEm: ['acaoRequisicao'] },
        ];
        try {
            const allStatuses = await db.getAllStatuses();
            if (allStatuses.length === 0) {
                // Auto-migrate if empty
                for (const status of defaultStatuses) {
                    await db.addStatus(status);
                }
                toast({ title: 'Status Padrão Criados', description: 'O sistema restaurou os status padrão automaticamente.' });

                // Reload to get the statuses with their generated IDs
                const reloadedStatuses = await db.getAllStatuses();
                setStatuses(reloadedStatuses || []);
            } else {
                setStatuses(allStatuses || []);
            }
        } catch (error) {
            console.error('Failed to load statuses:', error);
            toast({ title: 'Erro', description: 'Erro ao carregar status.', variant: 'destructive' });
        }
    }, [toast]);

    useEffect(() => {
        loadStatuses();
    }, [loadStatuses]);

    const reloadData = useAppStore((state: AppState) => state.reloadData);

    const handleSaveStatus = () => {
        setIsStatusDialogOpen(false);
        setEditingStatus(null);
        loadStatuses();
        reloadData('statuses');
    };

    const handleEditStatus = (status: CustomStatus) => {
        setEditingStatus(status);
        setIsStatusDialogOpen(true);
    };

    const handleDeleteStatus = async () => {
        if (!deleteTarget?.id) return;
        try {
            await db.deleteStatus(deleteTarget.id);
            toast({ title: 'Sucesso', description: 'Status excluído com sucesso.' });
            loadStatuses();
        } catch (error) {
            console.error('Failed to delete status:', error);
            toast({ title: 'Erro', description: 'Erro ao excluir status.', variant: 'destructive' });
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Status</h1>
                <p className="text-lg text-muted-foreground">
                    Crie e personalize os status utilizados em Garantias, Lotes e Devoluções.
                </p>
            </div>

            {/* --- Status Management Card --- */}
            <Card className="shadow-lg w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Status do Sistema</CardTitle>
                        <CardDescription>
                            Estes status controlam o fluxo de trabalho dos registros.
                        </CardDescription>
                    </div>
                    <Button onClick={() => { setEditingStatus(null); setIsStatusDialogOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Status
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {statuses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">Nenhum status personalizado criado.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {statuses.map((status) => (
                                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full border shadow-sm"
                                                style={{ backgroundColor: status.cor }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{status.nome}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {status.aplicavelEm.map(app => (
                                                        <Badge key={app} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                            {app === 'garantia' ? 'Garantia' : app === 'lote' ? 'Lote' : app === 'devolucao' ? 'Devolução' : 'Req.'}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditStatus(status)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(status)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* --- Status Dialog --- */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStatus ? 'Editar Status' : 'Novo Status'}</DialogTitle>
                        <DialogDescription>
                            Defina o nome, cor e onde este status será utilizado.
                        </DialogDescription>
                    </DialogHeader>
                    <StatusForm onSave={handleSaveStatus} editingStatus={editingStatus} />
                </DialogContent>
            </Dialog>

            {/* --- Delete Confirmation --- */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Status</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o status <span className="font-bold">{deleteTarget?.nome}</span>?
                            Isso não afetará os registros que já utilizam este status, mas ele não estará mais disponível para novas seleções.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStatus} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

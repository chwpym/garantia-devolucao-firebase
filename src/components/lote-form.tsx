'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Lote, Supplier, LoteStatus } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

const loteStatuses: [LoteStatus, ...LoteStatus[]] = ['Aberto', 'Enviado', 'Aprovado Parcialmente', 'Aprovado Totalmente', 'Recusado'];

const formSchema = z.object({
  nome: z.string().min(2, { message: 'O nome do lote deve ter pelo menos 2 caracteres.' }),
  fornecedor: z.string({ required_error: 'Selecione um fornecedor.' }),
  notaFiscalSaida: z.string().optional(),
  notasFiscaisRetorno: z.string().optional(),
  status: z.enum(loteStatuses, { required_error: 'Selecione um status.' }),
});

type LoteFormValues = z.infer<typeof formSchema>;

interface LoteFormProps {
  onSave: () => void;
  editingLote?: Lote | null;
  suppliers: Supplier[];
}

export default function LoteForm({ onSave, editingLote, suppliers }: LoteFormProps) {
  const { toast } = useToast();
  const form = useForm<LoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingLote || { nome: '', fornecedor: '', notaFiscalSaida: '', notasFiscaisRetorno: '', status: 'Aberto' },
  });

  useEffect(() => {
    form.reset(editingLote ? {
      ...editingLote,
      notaFiscalSaida: editingLote.notaFiscalSaida || '',
      notasFiscaisRetorno: editingLote.notasFiscaisRetorno || '',
    } : { nome: '', fornecedor: '', notaFiscalSaida: '', notasFiscaisRetorno: '', status: 'Aberto' });
  }, [editingLote, form]);

  const { isSubmitting } = form.formState;

  const handleSave = async (data: LoteFormValues) => {
    try {
      if (editingLote?.id) {
        const updatedLote: Lote = {
          ...editingLote,
          ...data,
        };
        await db.updateLote(updatedLote);
        toast({ title: 'Sucesso', description: 'Lote atualizado com sucesso.' });
      } else {
        const newLote: Omit<Lote, 'id'> = {
          ...data,
          dataCriacao: new Date().toISOString(),
        };
        await db.addLote(newLote);
        toast({ title: 'Sucesso', description: 'Lote criado com sucesso.' });
      }
      onSave();
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to save lote:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o lote.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <div className="space-y-4 px-1">
          <FormField
            name="nome"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Lote</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Lote para Fornecedor X - JAN/2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="fornecedor"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor para o lote" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.nomeFantasia}>
                        {s.nomeFantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            name="notaFiscalSaida"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota Fiscal de Saída (Envio)</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o número da nota de envio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="notasFiscaisRetorno"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota(s) Fiscal(is) de Retorno</FormLabel>
                <FormControl>
                  <Textarea placeholder="Digite os números das notas, separados por vírgula" {...field} />
                </FormControl>
                <FormDescription>
                    Se houver mais de uma, separe por vírgulas. Ex: 12345, 67890
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="status"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Lote</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um status para o lote" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {loteStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingLote ? 'Atualizar Lote' : 'Criar Lote'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

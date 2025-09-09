'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Lote, Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  nome: z.string().min(2, { message: 'O nome do lote deve ter pelo menos 2 caracteres.' }),
  fornecedor: z.string({ required_error: 'Selecione um fornecedor.' }),
  notasFiscaisRetorno: z.string().optional(),
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
    defaultValues: editingLote || { nome: '', fornecedor: '', notasFiscaisRetorno: '' },
  });

  useEffect(() => {
    form.reset(editingLote ? {
      ...editingLote,
      notasFiscaisRetorno: editingLote.notasFiscaisRetorno || '',
    } : { nome: '', fornecedor: '', notasFiscaisRetorno: '' });
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
          status: 'Aberto',
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

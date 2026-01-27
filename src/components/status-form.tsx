<<<<<<< HEAD


=======
>>>>>>> feature/status-visual-pro
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { CustomStatus, StatusApplicability } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from './ui/checkbox';

const applicabilityOptions: { id: StatusApplicability; label: string }[] = [
<<<<<<< HEAD
  { id: 'garantia', label: 'Garantias' },
  { id: 'lote', label: 'Lotes' },
  { id: 'devolucao', label: 'Devoluções (Status)' },
  { id: 'acaoRequisicao', label: 'Devoluções (Ação na Requisição)' },
];

const formSchema = z.object({
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, { message: 'Cor inválida. Use o formato hexadecimal, ex: #RRGGBB' }),
  aplicavelEm: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Selecione pelo menos um módulo de aplicação.',
  }),
=======
    { id: 'garantia', label: 'Garantias' },
    { id: 'lote', label: 'Lotes' },
    { id: 'devolucao', label: 'Devoluções (Status)' },
    { id: 'acaoRequisicao', label: 'Devoluções (Ação na Requisição)' },
];

const formSchema = z.object({
    nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
    cor: z.string().regex(/^#[0-9A-F]{6}$/i, { message: 'Cor inválida. Use o formato hexadecimal, ex: #RRGGBB' }),
    aplicavelEm: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: 'Selecione pelo menos um módulo de aplicação.',
    }),
>>>>>>> feature/status-visual-pro
});

type StatusFormValues = z.infer<typeof formSchema>;

interface StatusFormProps {
<<<<<<< HEAD
  onSave: () => void;
  editingStatus?: CustomStatus | null;
}

export default function StatusForm({ onSave, editingStatus }: StatusFormProps) {
  const { toast } = useToast();
  
  const form = useForm<StatusFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingStatus
      ? { ...editingStatus, cor: editingStatus.cor || '#000000' }
      : { nome: '', cor: '#6B7280', aplicavelEm: [] },
  });

  useEffect(() => {
    if (editingStatus) {
      form.reset({
        ...editingStatus,
        cor: editingStatus.cor || '#000000',
      });
    }
  }, [editingStatus, form]);

  const { isSubmitting } = form.formState;

  const handleSave = async (data: StatusFormValues) => {
    try {
      const dataToSave = {
          ...data,
          aplicavelEm: data.aplicavelEm as StatusApplicability[],
      };

      const allStatuses = await db.getAllStatuses();
      const isDuplicate = allStatuses.some(
        s => s.nome.toLowerCase() === data.nome.toLowerCase() && s.id !== editingStatus?.id
      );

      if (isDuplicate) {
          toast({ title: 'Nome Duplicado', description: 'Já existe um status com este nome.', variant: 'destructive'});
          return;
      }

      if (editingStatus?.id) {
        await db.updateStatus({ ...dataToSave, id: editingStatus.id });
        toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' });
      } else {
        await db.addStatus(dataToSave);
        toast({ title: 'Sucesso', description: 'Status criado com sucesso.' });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save status:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <div className="space-y-4 px-1 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            name="nome"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Status</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Em Análise" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="cor"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <div className='flex items-center gap-2'>
                    <FormControl>
                        <Input type="color" {...field} className="p-1 h-10 w-14"/>
                    </FormControl>
                    <Input 
                        value={field.value} 
                        onChange={field.onChange} 
                        placeholder="#RRGGBB" 
                        maxLength={7}
                    />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="aplicavelEm"
            control={form.control}
            render={() => (
                <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Módulos de Aplicação</FormLabel>
                        <p className="text-sm text-muted-foreground">
                            Selecione onde este status poderá ser utilizado.
                        </p>
                    </div>
                    {applicabilityOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="aplicavelEm"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingStatus ? 'Atualizar Status' : 'Criar Status'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
=======
    onSave: () => void;
    editingStatus?: CustomStatus | null;
}

export default function StatusForm({ onSave, editingStatus }: StatusFormProps) {
    const { toast } = useToast();

    const form = useForm<StatusFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: editingStatus
            ? { ...editingStatus, cor: editingStatus.cor || '#000000' }
            : { nome: '', cor: '#6B7280', aplicavelEm: [] },
    });

    useEffect(() => {
        if (editingStatus) {
            form.reset({
                ...editingStatus,
                cor: editingStatus.cor || '#000000',
            });
        }
    }, [editingStatus, form]);

    const { isSubmitting } = form.formState;

    const handleSave = async (data: StatusFormValues) => {
        try {
            const dataToSave = {
                ...data,
                aplicavelEm: data.aplicavelEm as StatusApplicability[],
            };

            const allStatuses = await db.getAllStatuses();
            const isDuplicate = allStatuses.some(
                s => s.nome.toLowerCase() === data.nome.toLowerCase() && s.id !== editingStatus?.id
            );

            if (isDuplicate) {
                toast({ title: 'Nome Duplicado', description: 'Já existe um status com este nome.', variant: 'destructive' });
                return;
            }

            if (editingStatus?.id) {
                await db.updateStatus({ ...dataToSave, id: editingStatus.id });
                toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' });
            } else {
                await db.addStatus(dataToSave);
                toast({ title: 'Sucesso', description: 'Status criado com sucesso.' });
            }
            onSave();
        } catch (error) {
            console.error('Failed to save status:', error);
            toast({
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar o status.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                <div className="space-y-4 px-1 max-h-[60vh] overflow-y-auto pr-4">
                    <FormField
                        name="nome"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Status</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Em Análise" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="cor"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cor</FormLabel>
                                <div className='flex items-center gap-2'>
                                    <FormControl>
                                        <Input type="color" {...field} className="p-1 h-10 w-14" />
                                    </FormControl>
                                    <Input
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="#RRGGBB"
                                        maxLength={7}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="aplicavelEm"
                        control={form.control}
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Módulos de Aplicação</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Selecione onde este status poderá ser utilizado.
                                    </p>
                                </div>
                                {applicabilityOptions.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="aplicavelEm"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={item.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== item.id
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {item.label}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editingStatus ? 'Atualizar Status' : 'Criar Status'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
>>>>>>> feature/status-visual-pro
}

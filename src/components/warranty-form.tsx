'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { Warranty, WarrantyStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const formSchema = z.object({
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  quantidade: z.coerce.number().min(0).optional(),
  defeito: z.string().optional(),
  requisicaoVenda: z.string().optional(),
  requisicaoGarantia: z.string().optional(),
  nfCompra: z.string().optional(),
  valorCompra: z.string().optional(),
  cliente: z.string().optional(),
  mecanico: z.string().optional(),
  notaRetorno: z.string().optional(),
  observacao: z.string().optional(),
  status: z.enum(['Em análise', 'Aprovada', 'Recusada']).optional(),
});

type WarrantyFormValues = z.infer<typeof formSchema>;

interface WarrantyFormProps {
  selectedWarranty: Warranty | null;
  onSave: (data: Omit<Warranty, 'id'>, id?: number) => Promise<void>;
  onClear: () => void;
}

const defaultValues: WarrantyFormValues = {
  codigo: '',
  descricao: '',
  quantidade: 1,
  defeito: '',
  requisicaoVenda: '',
  requisicaoGarantia: '',
  nfCompra: '',
  valorCompra: '',
  cliente: '',
  mecanico: '',
  notaRetorno: '',
  observacao: '',
  status: 'Em análise',
};

export default function WarrantyForm({ selectedWarranty, onSave, onClear }: WarrantyFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const form = useForm<WarrantyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: selectedWarranty ? {
            ...selectedWarranty,
            quantidade: selectedWarranty.quantidade ?? 1,
            status: selectedWarranty.status ?? 'Em análise',
        } : defaultValues,
    });

    const { isSubmitting } = form.formState;

    useEffect(() => {
        form.reset(selectedWarranty ? {
        ...selectedWarranty,
        quantidade: selectedWarranty.quantidade ?? 1,
        status: selectedWarranty.status ?? 'Em análise',
        } : defaultValues);
    }, [selectedWarranty, form]);

    const handleSubmit = async (values: WarrantyFormValues) => {
        const dataToSave: Omit<Warranty, 'id'> = {
        ...values,
        quantidade: values.quantidade ?? 1,
        status: values.status ?? 'Em análise',
        };

        if (!selectedWarranty?.id) {
            dataToSave.dataRegistro = new Date().toISOString();
        } else {
            dataToSave.dataRegistro = selectedWarranty.dataRegistro;
        }

        await onSave(dataToSave, selectedWarranty?.id);
        form.reset(defaultValues);
    };
    
    const handleClear = () => {
        form.reset(defaultValues);
        onClear();
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.target instanceof HTMLElement) {
            // Prevent form submission on Enter press, except for the submit button itself
            if (e.target.tagName !== 'BUTTON' && (e.target.tagName !== 'TEXTAREA')) {
                e.preventDefault();
                
                const formElements = formRef.current?.elements;
                if (!formElements) return;

                const focusable = Array.from(formElements).filter(
                    (el: any) => el.offsetParent !== null && !el.readOnly && !el.disabled
                );
                
                const currentIndex = focusable.indexOf(e.target as HTMLElement);
                const nextElement = focusable[currentIndex + 1] as HTMLElement | undefined;

                if (nextElement) {
                    nextElement.focus();
                } else {
                     // If it's the last element, you might want to focus the submit button
                    const submitButton = Array.from(formElements).find((el: any) => el.type === 'submit') as HTMLElement | undefined;
                    submitButton?.focus();
                }
            }
        }
    };

    return (
        <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>{selectedWarranty ? 'Editar Garantia' : 'Cadastrar Garantia'}</CardTitle>
            <CardDescription>Preencha os detalhes da garantia abaixo. Use "Enter" para pular para o próximo campo.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={handleKeyDown} ref={formRef}>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Informações do Produto e Defeito</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField name="codigo" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="descricao" control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="quantidade" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="defeito" control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-4"><FormLabel>Defeito Apresentado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                </div>

                <Separator />

                <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Dados Fiscais e de Venda</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField name="cliente" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="mecanico" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Mecânico</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="nfCompra" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>NF Compra</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="valorCompra" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Valor Compra</FormLabel><FormControl><Input placeholder="R$ 0,00" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="requisicaoVenda" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Requisição Venda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="requisicaoGarantia" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Requisição Garantia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="notaRetorno" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Nota Retorno</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um status" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Em análise">Em análise</SelectItem>
                                        <SelectItem value="Aprovada">Aprovada</SelectItem>
                                        <SelectItem value="Recusada">Recusada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Observações</h3>
                <FormField name="observacao" control={form.control} render={({ field }) => (
                        <FormItem><FormControl><Textarea rows={2} placeholder="Adicione qualquer observação relevante aqui..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClear}>Limpar</Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {selectedWarranty ? 'Atualizar' : 'Salvar'}
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>
    );
}

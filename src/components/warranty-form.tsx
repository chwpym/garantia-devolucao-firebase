'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import type { Warranty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
};

export default function WarrantyForm({ selectedWarranty, onSave, onClear }: WarrantyFormProps) {
  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: selectedWarranty ? {
        ...selectedWarranty,
        quantidade: selectedWarranty.quantidade ?? 1,
    } : defaultValues,
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    form.reset(selectedWarranty ? {
      ...selectedWarranty,
      quantidade: selectedWarranty.quantidade ?? 1,
    } : defaultValues);
  }, [selectedWarranty, form]);

  const handleSubmit = async (values: WarrantyFormValues) => {
    const dataToSave: Omit<Warranty, 'id'> = {
      ...values,
      quantidade: values.quantidade ?? 1,
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

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>{selectedWarranty ? 'Editar Garantia' : 'Cadastrar Garantia'}</CardTitle>
        <CardDescription>Preencha os detalhes da garantia abaixo.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="codigo" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="descricao" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="quantidade" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="defeito" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Defeito</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField name="cliente" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField name="mecanico" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Mecânico</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="requisicaoVenda" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Requisição Venda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="requisicaoGarantia" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Requisição Garantia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="nfCompra" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>NF Compra</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="valorCompra" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Valor Compra</FormLabel><FormControl><Input placeholder="R$ 0,00" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="notaRetorno" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Nota Retorno</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <FormField name="observacao" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Observação</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
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

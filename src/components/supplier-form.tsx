
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { DialogFooter } from './ui/dialog';

const formSchema = z.object({
  razaoSocial: z.string().min(2, { message: 'A razão social deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z.string().min(2, { message: 'O nome fantasia deve ter pelo menos 2 caracteres.' }),
  cnpj: z.string().optional(),
  cidade: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
  onSave: (newSupplier: Supplier) => void;
  editingSupplier?: Supplier | null;
  onClear?: () => void;
  isModal?: boolean;
}

const defaultFormValues: SupplierFormValues = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  cidade: ''
};

const formatCNPJ = (value: string) => {
    if (!value) return '';
    const cnpj = value.replace(/[^\d]/g, '');
    return cnpj
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

export default function SupplierForm({ onSave, editingSupplier, onClear, isModal = false }: SupplierFormProps) {
  const { toast } = useToast();
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingSupplier || defaultFormValues,
  });

  useEffect(() => {
    const defaultVals = editingSupplier ? {
        ...editingSupplier,
        cnpj: editingSupplier.cnpj ? formatCNPJ(editingSupplier.cnpj) : '',
    } : defaultFormValues;
    form.reset(defaultVals);
  }, [editingSupplier, form]);

  const { isSubmitting } = form.formState;

  const handleSave = async (data: SupplierFormValues) => {
    try {
      const dataToSave = {
        ...data,
        cnpj: data.cnpj?.replace(/[^\d]/g, '') || '',
        cidade: data.cidade || ''
      };

      if (editingSupplier?.id) {
        const updatedSupplier = { ...dataToSave, id: editingSupplier.id }
        await db.updateSupplier(updatedSupplier);
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado com sucesso.' });
        onSave(updatedSupplier)
      } else {
        const id = await db.addSupplier(dataToSave);
        const newSupplier = { ...dataToSave, id };
        toast({ title: 'Sucesso', description: 'Fornecedor salvo com sucesso.' });
        onSave(newSupplier);
      }
      form.reset(defaultFormValues);
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to save supplier:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o fornecedor.',
        variant: 'destructive',
      });
    }
  };

  const FormContent = (
      <div className="space-y-4 pt-4">
        <FormField
          name="nomeFantasia"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Fantasia</FormLabel>
              <FormControl>
                <Input placeholder="Nome da Empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="razaoSocial"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razão Social</FormLabel>
              <FormControl>
                <Input placeholder="Razão Social Ltda." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="cnpj"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  placeholder="00.000.000/0000-00"
                  {...field}
                  onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="cidade"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input placeholder="Cidade - UF" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
  )

  const FooterComponent = isModal ? DialogFooter : CardFooter;
  const footerProps = isModal ? { className: 'pt-6' } : { className: 'flex justify-end gap-2 pr-0' };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        {isModal ? FormContent : <CardContent>{FormContent}</CardContent>}
        
        <FooterComponent {...footerProps}>
          {onClear && <Button type="button" variant="outline" onClick={onClear}>Limpar</Button>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingSupplier ? 'Atualizar' : 'Salvar'}
          </Button>
        </FooterComponent>
      </form>
    </Form>
  );
}

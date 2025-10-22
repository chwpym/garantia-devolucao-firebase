
'use client';

import { useEffect, useState } from 'react';
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
import { DialogClose, DialogFooter } from './ui/dialog';

const formSchema = z.object({
  razaoSocial: z.string().min(2, { message: 'A razão social deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z.string().min(2, { message: 'O nome fantasia deve ter pelo menos 2 caracteres.' }),
  cnpj: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
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
  cep: '',
  endereco: '',
  bairro: '',
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
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

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

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    // A condição para executar a busca: apenas se não estiver editando.
    if (editingSupplier) return;

    const cnpj = e.target.value.replace(/\D/g, '');
    if (cnpj.length !== 14) return;

    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error('CNPJ não encontrado ou API indisponível.');
      
      const data = await response.json();
      
      form.setValue('razaoSocial', data.razao_social || '');
      form.setValue('nomeFantasia', data.nome_fantasia || data.razao_social || '');
      form.setValue('cep', data.cep || '');
      form.setValue('endereco', `${data.logradouro || ''}, ${data.numero || ''}`);
      form.setValue('bairro', data.bairro || '');
      form.setValue('cidade', `${data.municipio || ''} - ${data.uf || ''}`);
      toast({ title: "Sucesso", description: "Dados do fornecedor preenchidos automaticamente." });
    } catch (err) {
      toast({
          title: "Erro ao Buscar CNPJ",
          description: err instanceof Error ? err.message : "Não foi possível buscar os dados do fornecedor.",
          variant: "destructive"
      });
    } finally {
        setIsFetchingCnpj(false);
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsFetchingCep(true);
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        
        const data = await response.json();
        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        form.setValue('endereco', data.logradouro);
        form.setValue('bairro', data.bairro);
        form.setValue('cidade', `${data.localidade} - ${data.uf}`);
        toast({ title: "Sucesso", description: "Endereço preenchido automaticamente." });
    } catch (err) {
        toast({
            title: "Erro ao Buscar CEP",
            description: err instanceof Error ? err.message : "Não foi possível buscar o endereço.",
            variant: "destructive"
        });
    } finally {
        setIsFetchingCep(false);
    }
  };

  const handleSave = async (data: SupplierFormValues) => {
    try {
      const dataToSave = {
        ...data,
        cnpj: data.cnpj?.replace(/[^\d]/g, '') || '',
        cidade: data.cidade || '',
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
          name="cnpj"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="00.000.000/0000-00"
                    {...field}
                    onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                    onBlur={handleCnpjBlur}
                  />
                  {isFetchingCnpj && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <FormField name="cep" control={form.control} render={({ field }) => (
              <FormItem className="md:col-span-1">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input placeholder="00000-000" {...field} onBlur={handleCepBlur} />
                        {isFetchingCep && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField name="endereco" control={form.control} render={({ field }) => (
              <FormItem className="md:col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl><Input placeholder="Rua Exemplo, 123" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField name="bairro" control={form.control} render={({ field }) => (
              <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
            )} />
            <FormField name="cidade" control={form.control} render={({ field }) => (
              <FormItem>
                  <FormLabel>Cidade/UF</FormLabel>
                  <FormControl><Input placeholder="São Paulo - SP" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
            )} />
        </div>
      </div>
  )

  const FooterComponent = isModal ? DialogFooter : CardFooter;
  const footerProps = isModal ? { className: 'pt-6' } : { className: 'flex justify-end gap-2 pr-0' };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        {isModal ? FormContent : <CardContent>{FormContent}</CardContent>}
        
        <FooterComponent {...footerProps}>
           {isModal && (
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Cancelar
                </Button>
            </DialogClose>
           )}
          {onClear && <Button type="button" variant="outline" onClick={onClear}>Limpar</Button>}
          <Button type="submit" disabled={isSubmitting || isFetchingCnpj || isFetchingCep}>
            {(isSubmitting || isFetchingCnpj || isFetchingCep) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingSupplier ? 'Atualizar' : 'Salvar'}
          </Button>
        </FooterComponent>
      </form>
    </Form>
  );
}

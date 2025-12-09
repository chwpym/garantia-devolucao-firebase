

'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { DialogClose, DialogFooter } from './ui/dialog';
import { formatPhoneNumber } from '@/lib/utils';

const contactInfoSchema = z.object({
  type: z.string().min(1, "O tipo é obrigatório."),
  value: z.string().min(1, "O valor é obrigatório."),
});

const formSchema = z.object({
  razaoSocial: z.string().min(2, { message: 'A razão social deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z.string().min(2, { message: 'O nome fantasia deve ter pelo menos 2 caracteres.' }),
  cnpj: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  codigoExterno: z.string().optional(),
  telefones: z.array(contactInfoSchema).optional(),
  emails: z.array(contactInfoSchema).optional(),
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
  cidade: '',
  codigoExterno: '',
  telefones: [{ type: 'Comercial', value: '' }],
  emails: [{ type: 'Principal', value: '' }],
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
    defaultValues: defaultFormValues,
  });

  const { fields: telefoneFields, append: appendTelefone, remove: removeTelefone } = useFieldArray({
    control: form.control,
    name: 'telefones',
  });
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: 'emails',
  });

  useEffect(() => {
    const defaultVals = editingSupplier ? {
        ...editingSupplier,
        razaoSocial: editingSupplier.razaoSocial || '',
        nomeFantasia: editingSupplier.nomeFantasia || '',
        cnpj: editingSupplier.cnpj ? formatCNPJ(editingSupplier.cnpj) : '',
        cep: editingSupplier.cep || '',
        endereco: editingSupplier.endereco || '',
        bairro: editingSupplier.bairro || '',
        cidade: editingSupplier.cidade || '',
        codigoExterno: editingSupplier.codigoExterno || '',
        telefones: editingSupplier.telefones?.length ? editingSupplier.telefones : [{ type: 'Comercial', value: '' }],
        emails: editingSupplier.emails?.length ? editingSupplier.emails : [{ type: 'Principal', value: '' }],
    } : defaultFormValues;
    form.reset(defaultVals);
  }, [editingSupplier, form]);

  const { isSubmitting } = form.formState;

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
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
      const cnpj = data.cnpj?.replace(/[^\d]/g, '') || '';
      
      if (cnpj) {
        const allSuppliers = await db.getAllSuppliers();
        const isDuplicate = allSuppliers.some(s => s.cnpj === cnpj && s.id !== editingSupplier?.id);
        if (isDuplicate) {
            toast({ title: 'Erro de Duplicidade', description: 'Já existe um fornecedor com este CNPJ.', variant: 'destructive'});
            return;
        }
      }

      const dataToSave = {
        ...data,
        cnpj,
        cidade: data.cidade || '',
        telefones: data.telefones?.filter(t => t.value),
        emails: data.emails?.filter(e => e.value),
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
      <div className="space-y-6 pt-4">
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
        <FormField
          name="codigoExterno"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código Externo</FormLabel>
              <FormControl>
                <Input placeholder="Código em outro sistema (ERP, etc)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-md border p-4">
            <FormLabel>Telefones</FormLabel>
            {telefoneFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <FormField control={form.control} name={`telefones.${index}.type`} render={({ field }) => (
                        <FormItem className="sm:col-span-4"><FormControl><Input placeholder="Tipo (Ex: Comercial)" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`telefones.${index}.value`} render={({ field }) => (
                        <FormItem className="sm:col-span-7"><FormControl><Input placeholder="(00) 0000-0000" {...field} onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTelefone(index)} className="sm:col-span-1 text-destructive hover:text-destructive" disabled={telefoneFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendTelefone({ type: 'Comercial', value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Telefone</Button>
        </div>

        <div className="space-y-4 rounded-md border p-4">
            <FormLabel>Emails</FormLabel>
            {emailFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <FormField control={form.control} name={`emails.${index}.type`} render={({ field }) => (
                        <FormItem className="sm:col-span-4"><FormControl><Input placeholder="Tipo (Ex: Financeiro)" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`emails.${index}.value`} render={({ field }) => (
                        <FormItem className="sm:col-span-7"><FormControl><Input type="email" placeholder="financeiro@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(index)} className="sm:col-span-1 text-destructive hover:text-destructive" disabled={emailFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendEmail({ type: 'Principal', value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Email</Button>
        </div>


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

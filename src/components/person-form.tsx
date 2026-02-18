
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Person } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber, formatCpfCnpj } from '@/lib/utils';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z.string().optional(),
  tipo: z.enum(['Cliente', 'Mecânico', 'Ambos'], { required_error: 'Selecione um tipo.' }),
  cpfCnpj: z.string().optional(),
  telefones: z.array(z.string()).default([]),
  emails: z.array(z.string().email({ message: "Email inválido." }).or(z.literal(''))).default([]),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  observacao: z.string().optional(),
  codigoExterno: z.string().optional(),
});

type PersonFormValues = z.infer<typeof formSchema>;

interface PersonFormProps {
  onSave: (newPerson: Person) => void;
  editingPerson?: Person | null;
  onClear?: () => void;
}

const defaultFormValues: PersonFormValues = {
  nome: '',
  nomeFantasia: '',
  tipo: 'Cliente',
  cpfCnpj: '',
  telefones: [''],
  emails: [''],
  cep: '',
  endereco: '',
  bairro: '',
  cidade: '',
  observacao: '',
  codigoExterno: '',
};




export default function PersonForm({ onSave, editingPerson, onClear }: PersonFormProps) {
  const { toast } = useToast();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingPerson ? {
      ...defaultFormValues,
      ...editingPerson,
      nomeFantasia: editingPerson.nomeFantasia || '',
      cpfCnpj: editingPerson.cpfCnpj ? formatCpfCnpj(editingPerson.cpfCnpj) : '',
      cep: editingPerson.cep || '',
      endereco: editingPerson.endereco || '',
      bairro: editingPerson.bairro || '',
      cidade: editingPerson.cidade || '',
      observacao: editingPerson.observacao || '',
      codigoExterno: editingPerson.codigoExterno || '',
      telefones: editingPerson.telefones && editingPerson.telefones.length > 0 
        ? editingPerson.telefones 
        : [editingPerson.telefone || ''],
      emails: editingPerson.emails && editingPerson.emails.length > 0 
        ? editingPerson.emails 
        : [editingPerson.email || ''],
    } : defaultFormValues,
  });
  const { isSubmitting } = form.formState;

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: "telefones" as never,
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: "emails" as never,
  });

  useEffect(() => {
    const defaultVals = editingPerson ? {
      ...defaultFormValues,
      ...editingPerson,
      nomeFantasia: editingPerson.nomeFantasia || '',
      cpfCnpj: editingPerson.cpfCnpj ? formatCpfCnpj(editingPerson.cpfCnpj) : '',
      cep: editingPerson.cep || '',
      endereco: editingPerson.endereco || '',
      bairro: editingPerson.bairro || '',
      cidade: editingPerson.cidade || '',
      observacao: editingPerson.observacao || '',
      codigoExterno: editingPerson.codigoExterno || '',
      telefones: editingPerson.telefones && editingPerson.telefones.length > 0 
        ? editingPerson.telefones 
        : [editingPerson.telefone || ''],
      emails: editingPerson.emails && editingPerson.emails.length > 0 
        ? editingPerson.emails 
        : [editingPerson.email || ''],
    } : defaultFormValues;
    form.reset(defaultVals as any);
  }, [editingPerson, form, defaultFormValues]);


  const handleSave = async (data: PersonFormValues) => {
    try {
      const dataToSave: Omit<Person, 'id'> = {
        ...data,
        cpfCnpj: data.cpfCnpj?.replace(/\D/g, ''),
        telefones: data.telefones.map(t => t.replace(/\D/g, '')).filter(t => t !== ''),
        emails: data.emails.filter(e => e !== ''),
      };

      // Validação de duplicidade de CPF/CNPJ ANTES de salvar
      if (!editingPerson?.id && dataToSave.cpfCnpj) {
        // Apenas valida ao criar nova pessoa (não ao editar)
        const allPersons = await db.getAllPersons();
        const existing = allPersons.find(p => p.cpfCnpj === dataToSave.cpfCnpj);

        if (existing) {
          toast({
            title: 'CPF/CNPJ Duplicado',
            description: `Já existe um registro com o CPF/CNPJ "${formatCpfCnpj(dataToSave.cpfCnpj)}".`,
            variant: 'destructive',
          });
          return;
        }
      }

      if (editingPerson?.id) {
        const updatedPerson = { ...dataToSave, id: editingPerson.id };
        await db.updatePerson(updatedPerson);
        toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' });
        onSave(updatedPerson);
      } else {
        const id = await db.addPerson(dataToSave);
        const newPerson = { ...dataToSave, id };
        toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' });
        onSave(newPerson);
      }
      form.reset(defaultFormValues);
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to save person:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o registro.',
        variant: 'destructive',
      });
    }
  };

  const handleCpfCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '');
    if (cnpj.length !== 14) return; // Only fetch for CNPJ

    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error('CNPJ não encontrado ou API indisponível');

      const data = await response.json();

      form.setValue('nome', data.razao_social || '');
      form.setValue('nomeFantasia', data.nome_fantasia || '');
      form.setValue('cep', data.cep || '');
      form.setValue('endereco', `${data.logradouro || ''}, ${data.numero || ''}`);
      form.setValue('bairro', data.bairro || '');
      form.setValue('cidade', `${data.municipio || ''} - ${data.uf || ''}`);
      toast({ title: "Sucesso", description: "Dados do CNPJ preenchidos automaticamente." });
    } catch (err) {
      toast({
        title: "Erro ao Buscar CNPJ",
        description: err instanceof Error ? err.message : "Não foi possível buscar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingCnpj(false);
    }
  }

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        <div className="space-y-4 px-1">
          <FormField
            name="nome"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo / Razão Social</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                  <Input placeholder="Nome popular da empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="Cliente" /></FormControl>
                      <FormLabel className="font-normal">Cliente</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="Mecânico" /></FormControl>
                      <FormLabel className="font-normal">Mecânico</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="Ambos" /></FormControl>
                      <FormLabel className="font-normal">Ambos</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="cpfCnpj"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF / CNPJ</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      {...field}
                      onChange={(e) => field.onChange(formatCpfCnpj(e.target.value))}
                      onBlur={handleCpfCnpjBlur}
                    />
                    {isFetchingCnpj && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Telefones</FormLabel>
              {phoneFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`telefones.${index}` as any}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            {...field} 
                            onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removePhone(index)}
                    disabled={phoneFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => appendPhone('')}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Telefone
              </Button>
            </div>

            <div className="space-y-2">
              <FormLabel>Emails</FormLabel>
              {emailFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`emails.${index}` as any}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="contato@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeEmail(index)}
                    disabled={emailFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => appendEmail('')}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Email
              </Button>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormField
              name="cep"
              control={form.control}
              render={({ field }) => (
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
              )}
            />
            <FormField
              name="endereco"
              control={form.control}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl><Input placeholder="Rua Exemplo, 123" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="bairro"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="cidade"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade/UF</FormLabel>
                  <FormControl><Input placeholder="São Paulo - SP" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            name="observacao"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adicione uma observação sobre o cliente ou mecânico..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          {onClear && <Button type="button" variant="outline" onClick={onClear}>Limpar</Button>}
          <Button type="submit" disabled={isSubmitting || isFetchingCep || isFetchingCnpj}>
            {isSubmitting || isFetchingCep || isFetchingCnpj ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingPerson ? 'Atualizar Registro' : 'Salvar Registro'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

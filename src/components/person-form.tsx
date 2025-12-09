

'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Person } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';
import { formatPhoneNumber } from '@/lib/utils';

const contactInfoSchema = z.object({
  type: z.string().min(1, "O tipo é obrigatório."),
  value: z.string().min(1, "O valor é obrigatório."),
});

const formSchema = z.object({
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z.string().optional(),
  tipo: z.enum(['Cliente', 'Mecânico', 'Ambos'], { required_error: 'Selecione um tipo.' }),
  cpfCnpj: z.string().optional(),
  telefones: z.array(contactInfoSchema).optional(),
  emails: z.array(contactInfoSchema).optional(),
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
  telefones: [{ type: 'Celular', value: '' }],
  emails: [{ type: 'Principal', value: '' }],
  cep: '',
  endereco: '',
  bairro: '',
  cidade: '',
  observacao: '',
  codigoExterno: '',
};

const formatCpfCnpj = (value: string) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) { // CPF
        return cleaned
            .slice(0, 11)
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    // CNPJ
    return cleaned
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};


export default function PersonForm({ onSave, editingPerson, onClear }: PersonFormProps) {
  const { toast } = useToast();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });
  const { isSubmitting } = form.formState;

  const { fields: telefoneFields, append: appendTelefone, remove: removeTelefone } = useFieldArray({
    control: form.control,
    name: 'telefones',
  });
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: 'emails',
  });

  useEffect(() => {
    const defaultVals = editingPerson ? {
        ...editingPerson,
        nome: editingPerson.nome || '',
        nomeFantasia: editingPerson.nomeFantasia || '',
        cpfCnpj: editingPerson.cpfCnpj ? formatCpfCnpj(editingPerson.cpfCnpj) : '',
        telefones: editingPerson.telefones?.length ? editingPerson.telefones : [{ type: 'Celular', value: '' }],
        emails: editingPerson.emails?.length ? editingPerson.emails : [{ type: 'Principal', value: '' }],
        cep: editingPerson.cep || '',
        endereco: editingPerson.endereco || '',
        bairro: editingPerson.bairro || '',
        cidade: editingPerson.cidade || '',
        observacao: editingPerson.observacao || '',
        codigoExterno: editingPerson.codigoExterno || '',
    } : defaultFormValues;
    form.reset(defaultVals);
  }, [editingPerson, form]);


  const handleSave = async (data: PersonFormValues) => {
    try {
      const doc = data.cpfCnpj?.replace(/\D/g, '') || '';
      
      if (doc) {
        const allPersons = await db.getAllPersons();
        const isDuplicate = allPersons.some(p => p.cpfCnpj === doc && p.id !== editingPerson?.id);
        if (isDuplicate) {
            toast({ title: 'Erro de Duplicidade', description: 'Já existe um registro com este CPF/CNPJ.', variant: 'destructive'});
            return;
        }
      }

      const dataToSave: Omit<Person, 'id'> = {
        ...data,
        cpfCnpj: doc,
        telefones: data.telefones?.filter(t => t.value),
        emails: data.emails?.filter(e => e.value),
      };

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
    if (cnpj.length !== 14) return; 

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
        <div className="space-y-6 px-1 max-h-[70vh] overflow-y-auto pr-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
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

            <div className="space-y-4 rounded-md border p-4">
                <FormLabel>Telefones</FormLabel>
                {telefoneFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <FormField control={form.control} name={`telefones.${index}.type`} render={({ field }) => (
                            <FormItem className="sm:col-span-4"><FormControl><Input placeholder="Tipo (Ex: Celular)" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`telefones.${index}.value`} render={({ field }) => (
                            <FormItem className="sm:col-span-7"><FormControl><Input placeholder="(00) 00000-0000" {...field} onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTelefone(index)} className="sm:col-span-1 text-destructive hover:text-destructive" disabled={telefoneFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                 <Button type="button" size="sm" variant="outline" onClick={() => appendTelefone({ type: 'Celular', value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Telefone</Button>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <FormLabel>Emails</FormLabel>
                {emailFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <FormField control={form.control} name={`emails.${index}.type`} render={({ field }) => (
                            <FormItem className="sm:col-span-4"><FormControl><Input placeholder="Tipo (Ex: Principal)" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`emails.${index}.value`} render={({ field }) => (
                            <FormItem className="sm:col-span-7"><FormControl><Input type="email" placeholder="contato@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(index)} className="sm:col-span-1 text-destructive hover:text-destructive" disabled={emailFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => appendEmail({ type: 'Principal', value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Email</Button>
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

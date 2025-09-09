'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Person } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CardContent, CardFooter } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  type: z.enum(['Cliente', 'Mecânico', 'Ambos'], { required_error: 'Selecione um tipo.' }),
});

type PersonFormValues = z.infer<typeof formSchema>;

interface PersonFormProps {
  onSave: (newPerson: Person) => void;
  editingPerson?: Person | null;
  onClear?: () => void;
}

const defaultFormValues: PersonFormValues = { name: '', type: 'Cliente' };

export default function PersonForm({ onSave, editingPerson, onClear }: PersonFormProps) {
  const { toast } = useToast();
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingPerson || defaultFormValues,
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    form.reset(editingPerson || defaultFormValues);
  }, [editingPerson, form]);


  const handleSave = async (data: PersonFormValues) => {
    try {
      if (editingPerson?.id) {
        const updatedPerson = { ...data, id: editingPerson.id };
        await db.updatePerson(updatedPerson);
        toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' });
        onSave(updatedPerson);
      } else {
        const id = await db.addPerson(data);
        const newPerson = { ...data, id };
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        <CardContent className="space-y-4 pt-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Cliente" />
                      </FormControl>
                      <FormLabel className="font-normal">Cliente</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Mecânico" />
                      </FormControl>
                      <FormLabel className="font-normal">Mecânico</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Ambos" />
                      </FormControl>
                      <FormLabel className="font-normal">Ambos</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pr-0">
          {onClear && <Button type="button" variant="outline" onClick={onClear}>Limpar</Button>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingPerson ? 'Atualizar' : 'Salvar'}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}

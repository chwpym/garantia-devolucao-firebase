'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from './ui/dialog';

const formSchema = z.object({
  codigo: z.string().min(1, { message: 'O código é obrigatório.' }),
  descricao: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }),
  referencia: z.string().optional(),
  marca: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  onSave: (newProduct: Product) => void;
  editingProduct?: Product | null;
  onClear?: () => void;
}

const defaultFormValues: ProductFormValues = {
  codigo: '',
  descricao: '',
  referencia: '',
  marca: ''
};

export default function ProductForm({ onSave, editingProduct, onClear }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingProduct || defaultFormValues,
  });

  useEffect(() => {
    form.reset(editingProduct || defaultFormValues);
  }, [editingProduct, form]);

  const { isSubmitting } = form.formState;

  const handleSave = async (data: ProductFormValues) => {
    try {
      // Validação de duplicidade ANTES de salvar
      if (!editingProduct?.id) {
        // Apenas valida ao criar novo produto (não ao editar)
        const existing = await db.getProductByCode(data.codigo);
        if (existing) {
          toast({
            title: 'Produto Duplicado',
            description: `Já existe um produto com o código "${data.codigo}".`,
            variant: 'destructive',
          });
          return;
        }
      }

      if (editingProduct?.id) {
        // Ao editar, não alteramos o código. Usamos o código original.
        const updatedProduct = {
          ...editingProduct,
          ...data,
          codigo: editingProduct.codigo
        };
        await db.updateProduct(updatedProduct);
        toast({ title: 'Sucesso', description: 'Produto atualizado com sucesso.' });
        onSave(updatedProduct);
      } else {
        const id = await db.addProduct(data);
        const newProduct = { ...data, id };
        toast({ title: 'Sucesso', description: 'Produto salvo com sucesso.' });
        onSave(newProduct);
      }
      form.reset(defaultFormValues);
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    }
  };

  const FormContent = (
    <div className="space-y-4 pt-4">
      <FormField
        name="codigo"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código</FormLabel>
            <FormControl>
              <Input
                placeholder="Código principal do produto"
                {...field}
                // O campo agora é sempre habilitado, a lógica de bloqueio está no 'handleSave'.
                disabled={false}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="descricao"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Input placeholder="Descrição detalhada do produto" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          name="marca"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Marca do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="referencia"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referência</FormLabel>
              <FormControl>
                <Input placeholder="Código de referência" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        {FormContent}

        <DialogFooter className="pt-6">
          {onClear && <Button type="button" variant="outline" onClick={onClear}>Limpar</Button>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingProduct ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

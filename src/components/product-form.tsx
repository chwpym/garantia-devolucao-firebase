'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from './ui/dialog';

const formSchema = z.object({
  codigo: z.string().optional().transform(val => val ? val.trim().toUpperCase() : ''),
  descricao: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }).transform(val => val.trim().toUpperCase()),
  referencia: z.string().optional(),
  marca: z.string().optional(),
  codigoExterno: z.string().optional(),
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
  marca: '',
  codigoExterno: ''
};

export default function ProductForm({ onSave, editingProduct, onClear }: ProductFormProps) {
  const { toast } = useToast();
  const reloadData = useAppStore(state => state.reloadData);
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
      if (editingProduct?.id && editingProduct.id !== -1) {
        // Ao editar, o código é sempre o ID
        const updatedProduct = {
          ...editingProduct,
          ...data,
          codigo: String(editingProduct.id)
        };
        await db.updateProduct(updatedProduct);
        toast({ title: 'Sucesso', description: 'Produto atualizado com sucesso.' });
        onSave(updatedProduct);
      } else {
        // Ao criar, salvamos com um código temporário e depois atualizamos com o ID real
        const tempData = { ...data, codigo: 'TEMP_' + Date.now() };
        const id = await db.addProduct(tempData);
        
        const finalProduct = { ...tempData, id, codigo: String(id) };
        await db.updateProduct(finalProduct);
        
        toast({ title: 'Sucesso', description: 'Produto salvo com sucesso.' });
        onSave(finalProduct);
      }
      form.reset(defaultFormValues);
      await reloadData('products');
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
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          name="codigo"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código (Automático)</FormLabel>
              <FormControl>
                <Input
                  placeholder={editingProduct?.id ? String(editingProduct.id) : "Gerado ao salvar"}
                  {...field}
                  value={editingProduct?.id ? String(editingProduct.id) : field.value}
                  disabled={true}
                  className="bg-muted cursor-not-allowed"
                />
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
              <FormLabel>Código Externo (ERP)</FormLabel>
              <FormControl>
                <Input placeholder="Código no sistema" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
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

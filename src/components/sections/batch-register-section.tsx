'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import * as db from "@/lib/db";
import type { Person, Supplier, Warranty } from "@/lib/types";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, Save, Loader2 } from "lucide-react";
import { Combobox } from "../ui/combobox";

const warrantyRowSchema = z.object({
  id: z.number(), // Used for unique key in React
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  fornecedor: z.string().optional(),
  quantidade: z.coerce.number().min(1).optional(),
  defeito: z.string().optional(),
  requisicaoVenda: z.string().optional(),
  cliente: z.string().optional(),
});

const formSchema = z.object({
  warranties: z.array(warrantyRowSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function BatchRegisterSection() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warranties: [{ id: Date.now(), quantidade: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "warranties",
  });

  const { isSubmitting } = form.formState;

  const loadDropdownData = useCallback(async () => {
    try {
      const [allPersons, allSuppliers] = await Promise.all([
        db.getAllPersons(),
        db.getAllSuppliers(),
      ]);
      setPersons(allPersons.sort((a, b) => a.nome.localeCompare(b.nome)));
      setSuppliers(
        allSuppliers.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia))
      );
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar clientes e fornecedores.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadDropdownData();
    window.addEventListener('datachanged', loadDropdownData);
    return () => window.removeEventListener('datachanged', loadDropdownData);
  }, [loadDropdownData]);

  const onSubmit = async (data: FormValues) => {
    const validWarranties = data.warranties.filter(
      (w) => w.codigo || w.descricao
    );

    if (validWarranties.length === 0) {
      toast({
        title: "Nenhuma garantia para salvar",
        description: "Preencha pelo menos um código ou descrição.",
        variant: "destructive",
      });
      return;
    }

    try {
      let savedCount = 0;
      for (const warrantyData of validWarranties) {
        const newWarranty: Omit<Warranty, "id"> = {
          ...warrantyData,
          quantidade: warrantyData.quantidade ?? 1,
          status: 'Em análise',
          dataRegistro: new Date().toISOString(),
        };
        await db.addWarranty(newWarranty);
        savedCount++;
      }
      toast({
        title: "Sucesso!",
        description: `${savedCount} garantias foram salvas com sucesso.`,
      });
      // Reset form to a single empty row
      form.reset({
        warranties: [{ id: Date.now(), quantidade: 1 }],
      });
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      toast({
        title: "Erro ao salvar garantias",
        description: "Ocorreu um erro ao tentar salvar os registros.",
        variant: "destructive",
      });
    }
  };

  const clientOptions = useMemo(() => persons
    .filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos')
    .map(c => ({ value: c.nome, label: c.nome })), 
    [persons]
  );
  
  const supplierOptions = useMemo(() => suppliers.map(s => ({ value: s.nomeFantasia, label: s.nomeFantasia })), [suppliers]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastro de Garantia em Lote</h1>
        <p className="text-lg text-muted-foreground">
          Adicione múltiplas garantias de forma rápida, como em uma planilha.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lançamento Rápido</CardTitle>
          <CardDescription>
            Preencha as linhas abaixo e clique em "Salvar Tudo". Linhas sem código ou descrição serão ignoradas.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Código</TableHead>
                      <TableHead className="min-w-[250px]">Descrição</TableHead>
                      <TableHead className="w-[80px]">Qtd.</TableHead>
                      <TableHead className="min-w-[200px]">Fornecedor</TableHead>
                      <TableHead className="min-w-[200px]">Cliente</TableHead>
                      <TableHead className="min-w-[150px]">Defeito</TableHead>
                      <TableHead className="min-w-[150px]">Requisição</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            name={`warranties.${index}.codigo`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Código do produto" />}
                          />
                        </TableCell>
                         <TableCell>
                          <Controller
                            name={`warranties.${index}.descricao`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Descrição do produto" />}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`warranties.${index}.quantidade`}
                            control={form.control}
                            render={({ field }) => <Input type="number" {...field} />}
                          />
                        </TableCell>
                        <TableCell>
                           <Controller
                            name={`warranties.${index}.fornecedor`}
                            control={form.control}
                            render={({ field }) => (
                                <Combobox 
                                    options={supplierOptions}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    placeholder="Fornecedor"
                                    searchPlaceholder="Buscar..."
                                    notFoundMessage="Nenhum encontrado."
                                />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                           <Controller
                            name={`warranties.${index}.cliente`}
                            control={form.control}
                            render={({ field }) => (
                                <Combobox 
                                    options={clientOptions}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    placeholder="Cliente"
                                    searchPlaceholder="Buscar..."
                                    notFoundMessage="Nenhum encontrado."
                                />
                            )}
                          />
                        </TableCell>
                         <TableCell>
                          <Controller
                            name={`warranties.${index}.defeito`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Defeito apresentado" />}
                          />
                        </TableCell>
                         <TableCell>
                          <Controller
                            name={`warranties.${index}.requisicaoVenda`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Nº da Requisição" />}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ id: Date.now(), quantidade: 1 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Linha
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Tudo
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

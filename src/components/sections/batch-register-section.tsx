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
import { Form } from "@/components/ui/form";
import { Label } from "../ui/label";

const warrantyRowSchema = z.object({
  id: z.number(), // Used for unique key in React
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser ao menos 1').optional(),
  defeito: z.string().optional(),
  requisicaoVenda: z.string().optional(),
  requisicoesGarantia: z.string().optional(),
  cliente: z.string().optional(),
  mecanico: z.string().optional(),
});

const formSchema = z.object({
  warranties: z.array(warrantyRowSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function BatchRegisterSection() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
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
    } catch {
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
    if (!selectedSupplier) {
        toast({
            title: "Fornecedor não selecionado",
            description: "Por favor, selecione um fornecedor para o lote.",
            variant: "destructive",
        });
        return;
    }
      
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
          fornecedor: selectedSupplier,
          quantidade: warrantyData.quantidade ?? 1,
          status: 'Em análise',
          dataRegistro: new Date().toISOString(),
        };
        await db.addWarranty(newWarranty);
        savedCount++;
      }
      toast({
        title: "Sucesso!",
        description: `${savedCount} garantias foram salvas com sucesso para o fornecedor ${selectedSupplier}.`,
      });
      // Reset form to a single empty row
      form.reset({
        warranties: [{ id: Date.now(), quantidade: 1 }],
      });
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch {
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

  const mechanicOptions = useMemo(() => persons
    .filter(p => p.tipo === 'Mecânico' || p.tipo === 'Ambos')
    .map(m => ({ value: m.nome, label: m.nome })),
    [persons]
  );
  
  const supplierOptions = useMemo(() => suppliers.map(s => ({ value: s.nomeFantasia, label: s.nomeFantasia })), [suppliers]);

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastro de Garantia em Lote</h1>
        <p className="text-lg text-muted-foreground">
          Adicione múltiplas garantias de forma rápida, como em uma planilha.
        </p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Lançamento Rápido</CardTitle>
          <CardDescription>
            Selecione um fornecedor e preencha as linhas abaixo. Linhas sem código ou descrição serão ignoradas.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
               <div className="max-w-sm space-y-2">
                  <Label htmlFor="supplier-selector" className="font-semibold">
                      Fornecedor <span className="text-destructive">*</span>
                  </Label>
                  <Combobox 
                      options={supplierOptions}
                      value={selectedSupplier}
                      onChange={setSelectedSupplier}
                      placeholder="Selecione um fornecedor"
                      searchPlaceholder="Buscar fornecedor..."
                      notFoundMessage="Nenhum encontrado."
                      className="w-full"
                  />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] p-2">Código</TableHead>
                      <TableHead className="min-w-[250px] p-2">Descrição</TableHead>
                      <TableHead className="w-[100px] p-2">Qtd.</TableHead>
                      <TableHead className="min-w-[150px] p-2">Defeito</TableHead>
                      <TableHead className="min-w-[150px] p-2">Req. Venda</TableHead>
                      <TableHead className="min-w-[150px] p-2">Req. Garantia</TableHead>
                      <TableHead className="min-w-[200px] p-2">Cliente</TableHead>
                      <TableHead className="min-w-[200px] p-2">Mecânico</TableHead>
                      <TableHead className="w-[50px] p-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="p-1">
                          <Controller
                            name={`warranties.${index}.codigo`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Código do produto" />}
                          />
                        </TableCell>
                         <TableCell className="p-1">
                          <Controller
                            name={`warranties.${index}.descricao`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Descrição do produto" />}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Controller
                            name={`warranties.${index}.quantidade`}
                            control={form.control}
                            render={({ field }) => <Input type="number" {...field} />}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Controller
                            name={`warranties.${index}.defeito`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Defeito apresentado" />}
                          />
                        </TableCell>
                         <TableCell className="p-1">
                          <Controller
                            name={`warranties.${index}.requisicaoVenda`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Nº da Req. de Venda" />}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Controller
                            name={`warranties.${index}.requisicoesGarantia`}
                            control={form.control}
                            render={({ field }) => <Input {...field} placeholder="Nº da Req. de Garantia" />}
                          />
                        </TableCell>
                        <TableCell className="p-1">
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
                        <TableCell className="p-1">
                           <Controller
                            name={`warranties.${index}.mecanico`}
                            control={form.control}
                            render={({ field }) => (
                                <Combobox 
                                    options={mechanicOptions}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    placeholder="Mecânico"
                                    searchPlaceholder="Buscar..."
                                    notFoundMessage="Nenhum encontrado."
                                />
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-1">
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
              <Button type="submit" disabled={isSubmitting || !selectedSupplier}>
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

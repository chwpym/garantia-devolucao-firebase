'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { CompanyData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
    nomeEmpresa: z.string().min(2, { message: "O nome da empresa é obrigatório." }).optional(),
    cnpj: z.string().optional(),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email({ message: "Por favor, insira um email válido." }).optional(),
});

type CompanyFormValues = z.infer<typeof formSchema>;

const defaultFormValues: CompanyFormValues = {
    nomeEmpresa: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    telefone: '',
    email: ''
};

export default function SettingsSection() {
    const { toast } = useToast();
    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues,
    });
    const { isSubmitting } = form.formState;
    
    useEffect(() => {
        async function loadCompanyData() {
            try {
                await db.initDB();
                const data = await db.getCompanyData();
                if (data) {
                    form.reset(data);
                }
            } catch (error) {
                toast({
                    title: "Erro ao Carregar Dados",
                    description: "Não foi possível carregar os dados da empresa.",
                    variant: "destructive"
                });
            }
        }
        loadCompanyData();
    }, [form, toast]);

    const handleSave = async (data: CompanyFormValues) => {
        try {
            await db.updateCompanyData(data);
            toast({
                title: "Sucesso!",
                description: "Os dados da empresa foram salvos com sucesso.",
            });
             window.dispatchEvent(new CustomEvent('datachanged'));
        } catch (error) {
            console.error('Failed to save company data:', error);
            toast({
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar os dados da empresa.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-lg text-muted-foreground">
                    Gerencie as informações da sua empresa.
                </p>
            </div>
            <Card className="shadow-lg max-w-2xl">
                <CardHeader>
                    <CardTitle>Dados da Empresa</CardTitle>
                    <CardDescription>
                        Estas informações serão usadas nos cabeçalhos dos relatórios em PDF.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)}>
                        <CardContent className="space-y-4">
                             <FormField
                                name="nomeEmpresa"
                                control={form.control}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Empresa</FormLabel>
                                    <FormControl><Input placeholder="Minha Empresa Ltda" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                name="endereco"
                                control={form.control}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl><Input placeholder="Rua Exemplo, 123 - Bairro" {...field} /></FormControl>
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
                            <FormField
                                name="telefone"
                                control={form.control}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                name="email"
                                control={form.control}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input placeholder="contato@minhaempresa.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar Alterações
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

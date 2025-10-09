
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, MoreHorizontal, Pencil } from 'lucide-react';
import * as db from '@/lib/db';
import { type UserProfile, type UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { DialogFooter } from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

const userFormSchema = z.object({
  uid: z.string().optional(),
  displayName: z.string().min(2, { message: 'O nome é obrigatório.' }),
  email: z
    .string()
    .email({ message: 'Por favor, insira um e-mail válido.' }),
  role: z.enum(['admin', 'user'], {
    required_error: 'Selecione um nível de permissão.',
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersSection() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await db.getAllUserProfiles();
      setUsers(allUsers);
    } catch (error) {
      toast({
        title: 'Erro ao Carregar Usuários',
        description: 'Não foi possível buscar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
     const handleDataChanged = () => loadUsers();
    window.addEventListener('datachanged', handleDataChanged);
    return () => window.removeEventListener('datachanged', handleDataChanged);
  }, [loadUsers]);
  
  useEffect(() => {
    if (isFormModalOpen && editingUser) {
        form.reset({
            uid: editingUser.uid,
            displayName: editingUser.displayName,
            email: editingUser.email,
            role: editingUser.role,
        });
    }
  }, [isFormModalOpen, editingUser, form]);


  const handleFormSubmit = async (data: UserFormValues) => {
    if (!editingUser) return; // Should not happen, but as a safeguard

    const updatedProfile: UserProfile = {
        ...editingUser,
        displayName: data.displayName,
        role: data.role as UserRole,
    };

    try {
        await db.upsertUserProfile(updatedProfile);
        toast({
            title: 'Sucesso!',
            description: `Usuário ${data.displayName} atualizado.`,
        });
        setIsFormModalOpen(false);
        setEditingUser(null);
        loadUsers();
    } catch (error) {
         toast({
            title: 'Erro ao Atualizar',
            description: 'Não foi possível atualizar o perfil do usuário.',
            variant: 'destructive',
        });
    }
  };
  
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Usuários
          </h1>
          <p className="text-lg text-muted-foreground">
            Visualize e edite o nível de acesso dos usuários do sistema.
          </p>
        </div>
      </div>

       <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Como Adicionar Novos Usuários</AlertTitle>
          <AlertDescription>
            Para garantir a segurança, novos usuários devem ser adicionados diretamente no Console do Firebase (na seção Authentication). Após serem criados lá, eles aparecerão nesta lista para que você possa editar seu nome e nível de acesso.
          </AlertDescription>
        </Alert>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Altere o nome ou nível de acesso do usuário.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                <div className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="usuario@email.com"
                            {...field}
                            disabled={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Acesso</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o nível de permissão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Usuário Padrão</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os usuários com acesso ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead className='text-right'>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">
                        {user.displayName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

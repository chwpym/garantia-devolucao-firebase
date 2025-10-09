
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
import { auth, createUserWithEmailAndPassword, updateProfile } from '@/lib/firebase';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

const userFormSchema = z.object({
  uid: z.string().optional(),
  displayName: z.string().min(2, { message: 'O nome é obrigatório.' }),
  email: z
    .string()
    .email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
    .optional(),
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
  }, [loadUsers]);
  
  useEffect(() => {
    if (isFormModalOpen && editingUser) {
        form.reset({
            uid: editingUser.uid,
            displayName: editingUser.displayName,
            email: editingUser.email,
            role: editingUser.role,
            password: '',
        });
    } else {
        form.reset({
            displayName: '',
            email: '',
            password: '',
            role: 'user',
        });
    }
  }, [isFormModalOpen, editingUser, form]);


  const handleFormSubmit = async (data: UserFormValues) => {
    if (editingUser) {
        // Update existing user
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
    } else {
        // Create new user
        if (!data.password) {
            form.setError('password', { type: 'manual', message: 'A senha é obrigatória para novos usuários.' });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
            const firebaseUser = userCredential.user;

            await updateProfile(firebaseUser, {
                displayName: data.displayName,
            });

            const newUserProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: data.displayName,
                role: data.role as UserRole,
            };

            await db.upsertUserProfile(newUserProfile);

            toast({
                title: 'Sucesso!',
                description: `Usuário ${data.displayName} criado com sucesso.`,
            });

            form.reset();
            setIsFormModalOpen(false);
            loadUsers();
        } catch (error: any) {
            console.error('Failed to create user:', error);
            let description =
                'Não foi possível criar o usuário. Verifique o console para mais detalhes.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'Este e-mail já está sendo utilizado por outra conta.';
            }
            toast({
                title: 'Erro ao Criar Usuário',
                description,
                variant: 'destructive',
            });
        }
    }
  };
  
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  }
  
  const openNewModal = () => {
    setEditingUser(null);
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
            Adicione, visualize e gerencie os usuários do sistema.
          </p>
        </div>
        <Button onClick={openNewModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Cadastrar Usuário
        </Button>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Altere o nome ou nível de acesso do usuário.' : 'Preencha os dados abaixo para criar um novo acesso ao sistema.'}
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
                            disabled={!!editingUser} // Disable email editing
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!editingUser && (
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                            <Input
                                type="password"
                                placeholder="Senha de acesso"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
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
                    {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
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


'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
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
import { Loader2, MoreHorizontal, Pencil, Ban, CheckCircle, ArrowUpDown, UserCheck, ShieldCheck, ShieldPlus } from 'lucide-react';
import * as db from '@/lib/db';
import { type UserProfile, type UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { adminCreateUser } from '@/lib/firebase';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/hooks/use-auth';

const onboardingSchema = z.object({
  displayName: z.string().min(2, { message: 'O nome é obrigatório.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['admin', 'user'], {
    required_error: 'Selecione um nível de permissão.',
  }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

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

type SortableKeys = keyof UserProfile;


export default function UsersSection() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'blocked'>('active');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'ascending' | 'descending' } | null>({ key: 'displayName', direction: 'ascending' });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

  const onboardingForm = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'user',
    },
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await db.getAllUserProfiles();
      setUsers(allUsers);
    } catch {
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


  const handleOnboardingSubmit = async (values: OnboardingFormValues, stayOpen: boolean) => {
    setIsOnboardingLoading(true);
    try {
      const firebaseUser = await adminCreateUser(values.email, values.password, values.displayName);

      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: values.email,
        displayName: values.displayName,
        role: values.role as UserRole,
        status: 'active',
      };

      await db.upsertUserProfile(newUserProfile);

      toast({
        title: 'Usuário Criado',
        description: `A conta de ${values.displayName} foi criada e ativada com sucesso.`,
      });

      loadUsers();

      if (stayOpen) {
        onboardingForm.reset({
          displayName: '',
          email: '',
          password: '',
          role: values.role,
        });
      } else {
        setIsOnboardingModalOpen(false);
        onboardingForm.reset();
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      let msg = 'Não foi possível criar o usuário.';
      if (error.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  const handleFormSubmit = async (data: UserFormValues) => {
    if (!editingUser) return;

    const updatedProfile: UserProfile = {
      ...editingUser,
      displayName: data.displayName,
      role: data.role as UserRole,
      status: editingUser.status || 'active',
    };

    try {
      await db.upsertUserProfile(updatedProfile);
      toast({
        title: 'Sucesso!',
        description: `Usuário ${data.displayName} atualizado.`,
      });
      setIsFormModalOpen(false);
      setEditingUser(null);
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch {
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

  const handleToggleBlockUser = async (user: UserProfile) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const updatedProfile: UserProfile = { ...user, status: newStatus };

    try {
      await db.upsertUserProfile(updatedProfile);
      toast({
        title: 'Sucesso!',
        description: `Usuário ${user.displayName} foi ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'}.`,
      });
      loadUsers();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveUser = async (user: UserProfile) => {
    const updatedProfile: UserProfile = { ...user, status: 'active' };

    try {
      await db.upsertUserProfile(updatedProfile);
      toast({
        title: 'Usuário Aprovado!',
        description: `${user.displayName} agora tem acesso ao sistema.`,
      });
      loadUsers();
      window.dispatchEvent(new CustomEvent('datachanged')); // Notifica o badge no header
    } catch {
      toast({
        title: 'Erro ao Aprovar',
        description: 'Não foi possível aprovar o usuário.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => user.status === activeTab);
  }, [users, activeTab]);

  const sortedUsers = useMemo(() => {
    const sortableItems = [...filteredUsers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredUsers, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: SortableKeys, children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="group px-2">
        {children}
        {getSortIcon(sortKey)}
      </Button>
    </TableHead>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Usuários
          </h1>
          <p className="text-lg text-muted-foreground">
            Visualize, edite e gerencie o acesso dos usuários do sistema.
          </p>
        </div>
        <Button
          onClick={() => {
            onboardingForm.reset();
            setIsOnboardingModalOpen(true);
          }}
          className="gap-2"
        >
          <ShieldPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Opções de Cadastro</AlertTitle>
        <AlertDescription>
          Você pode cadastrar usuários diretamente pelo botão <strong>Novo Usuário</strong> (eles já entram como ativos) ou orientá-los a usar a <a href="/signup" className='underline font-medium'>página de cadastro público</a> para aprovação manual.
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
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Onboarding (Novo Usuário) */}
      <Dialog open={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário do Sistema</DialogTitle>
            <DialogDescription>
              Crie uma nova conta com acesso imediato (Ativo).
            </DialogDescription>
          </DialogHeader>
          <Form {...onboardingForm}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 py-4" autoComplete="off">
              <FormField
                control={onboardingForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={onboardingForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@empresa.com" {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={onboardingForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Temporária</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={onboardingForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Acesso</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
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

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="sm:order-1"
                >
                  Cancelar
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 sm:order-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isOnboardingLoading}
                    onClick={onboardingForm.handleSubmit((values) => handleOnboardingSubmit(values, true))}
                  >
                    {isOnboardingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar e Continuar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isOnboardingLoading}
                    onClick={onboardingForm.handleSubmit((values) => handleOnboardingSubmit(values, false))}
                  >
                    {isOnboardingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Usuário
                  </Button>
                </div>
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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
              <TabsTrigger value="active" className="gap-2">
                <UserCheck className="h-4 w-4" /> Ativos
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Loader2 className={`h-4 w-4 ${users.filter(u => u.status === 'pending').length > 0 ? 'inline' : 'hidden'}`} />
                Pendentes
                {users.filter(u => u.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {users.filter(u => u.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="blocked" className="gap-2">
                <Ban className="h-4 w-4" /> Bloqueados
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="h-24 text-center flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <div key={user.uid} className="border p-4 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold">{user.displayName}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(user)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        {user.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleApproveUser(user)} className="text-green-600 focus:text-green-700">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Aprovar Acesso
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleBlockUser(user)}
                          className={user.status === 'blocked' ? 'text-green-600 focus:text-green-700' : 'text-destructive focus:text-destructive'}
                          disabled={user.uid === currentUser?.uid}>
                          {user.status === 'blocked' ? <><CheckCircle className="mr-2 h-4 w-4" /> Desbloquear</> : <><Ban className="mr-2 h-4 w-4" /> Bloquear</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                    <Badge variant={user.status === 'blocked' ? 'destructive' : user.status === 'pending' ? 'default' : 'outline'}>
                      {user.status === 'blocked' ? 'Bloqueado' : user.status === 'pending' ? 'Pendente' : 'Ativo'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-24 text-center flex items-center justify-center">
                <p>Nenhum usuário encontrado.</p>
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey='displayName'>Nome</SortableHeader>
                  <SortableHeader sortKey='email'>Email</SortableHeader>
                  <SortableHeader sortKey='role'>Nível</SortableHeader>
                  <SortableHeader sortKey='status'>Status</SortableHeader>
                  <TableHead className='text-right'>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <TableRow key={user.uid} className={user.status === 'blocked' ? 'bg-muted/50 text-muted-foreground' : ''}>
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
                      <TableCell>
                        <Badge
                          variant={user.status === 'blocked' ? 'destructive' : user.status === 'pending' ? 'default' : 'outline'}
                        >
                          {user.status === 'blocked' ? 'Bloqueado' : user.status === 'pending' ? 'Pendente' : 'Ativo'}
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
                            {user.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleApproveUser(user)} className="text-green-600 focus:text-green-700">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Aprovar Acesso
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleBlockUser(user)}
                              className={user.status === 'blocked' ? 'text-green-600 focus:text-green-700' : 'text-destructive focus:text-destructive'}
                              disabled={user.uid === currentUser?.uid}>
                              {user.status === 'blocked' ? (
                                <><CheckCircle className="mr-2 h-4 w-4" /> Desbloquear</>
                              ) : (
                                <><Ban className="mr-2 h-4 w-4" /> Bloquear</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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

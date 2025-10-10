

'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
import { Loader2, MoreHorizontal, Pencil, Ban, CheckCircle, ArrowUpDown, Upload } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { uploadFile } from '@/lib/storage';

const userFormSchema = z.object({
  uid: z.string().optional(),
  displayName: z.string().min(2, { message: 'O nome é obrigatório.' }),
  email: z
    .string()
    .email({ message: 'Por favor, insira um e-mail válido.' }),
  role: z.enum(['admin', 'user'], {
    required_error: 'Selecione um nível de permissão.',
  }),
  photoURL: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type SortableKeys = keyof UserProfile;

const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function UsersSection() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'ascending' | 'descending' } | null>({ key: 'displayName', direction: 'ascending' });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            photoURL: editingUser.photoURL,
        });
    }
  }, [isFormModalOpen, editingUser, form]);


  const handleFormSubmit = async (data: UserFormValues) => {
    if (!editingUser) return;

    const updatedProfile: UserProfile = {
        ...editingUser,
        displayName: data.displayName,
        role: data.role as UserRole,
        status: editingUser.status || 'active',
        photoURL: data.photoURL,
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
    } catch (error) {
         toast({
            title: 'Erro ao Atualizar',
            description: 'Não foi possível atualizar o perfil do usuário.',
            variant: 'destructive',
        });
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !editingUser) return;
    
    const file = event.target.files[0];
    setIsUploading(true);

    try {
        const filePath = `profile-pictures/${editingUser.uid}/${file.name}`;
        const downloadURL = await uploadFile(file, filePath);
        
        form.setValue('photoURL', downloadURL);
        toast({
            title: 'Upload Concluído',
            description: "A nova foto de perfil está pronta. Clique em 'Salvar Alterações' para aplicá-la."
        });

    } catch (error) {
        toast({
            title: 'Erro de Upload',
            description: 'Não foi possível enviar a imagem.',
            variant: 'destructive'
        });
    } finally {
        setIsUploading(false);
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
    } catch (error) {
       toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      });
    }
  };
  
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
        if (showBlocked) {
            return user.status === 'blocked';
        }
        return user.status !== 'blocked';
    });
  }, [users, showBlocked]);

  const sortedUsers = useMemo(() => {
    let sortableItems = [...filteredUsers];
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
      </div>

       <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Como Adicionar Novos Usuários</AlertTitle>
          <AlertDescription>
            Para garantir a segurança, novos usuários devem se cadastrar pela página de <a href="/signup" className='underline'>cadastro público</a>. Após se registrarem, eles aparecerão nesta lista com o nível "Usuário Padrão" e você poderá editar suas permissões ou status.
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
                        name="photoURL"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center">
                                <FormControl>
                                    <div>
                                        <input type="file" ref={fileInputRef} className='hidden' onChange={handleProfilePictureUpload} accept="image/*"/>
                                        <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <AvatarImage src={field.value ?? ''} />
                                            <AvatarFallback>
                                                {isUploading ? <Loader2 className="h-6 w-6 animate-spin"/> : getInitials(editingUser?.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </FormControl>
                                <Button type="button" variant="link" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4"/>
                                    Alterar Foto
                                </Button>
                            </FormItem>
                        )}
                    />
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
                    disabled={form.formState.isSubmitting || isUploading}
                  >
                    {form.formState.isSubmitting || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                    id="show-blocked"
                    checked={showBlocked}
                    onCheckedChange={(checked) => setShowBlocked(Boolean(checked))}
                />
                <Label htmlFor="show-blocked">Mostrar usuários bloqueados</Label>
            </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[80px]'>Avatar</TableHead>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <TableRow key={user.uid} className={user.status === 'blocked' ? 'bg-muted/50 text-muted-foreground' : ''}>
                       <TableCell>
                          <Avatar>
                            <AvatarImage src={user.photoURL ?? ''} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
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
                          variant={user.status === 'blocked' ? 'destructive' : 'outline'}
                        >
                          {user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
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
                    <TableCell colSpan={6} className="h-24 text-center">
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


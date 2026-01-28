
'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export function UserNav() {
  const { user, pendingUsersCount } = useAuth();
  const { toast } = useToast();
  const resetAppStore = useAppStore(state => state.resetState);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetAppStore(); // Limpa todo o estado do app (Fase 11a)
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      })
      // O AuthGuard cuidará do redirecionamento
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível realizar o logout.",
        variant: "destructive"
      });
    }
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 rounded-full px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground hidden sm:inline-block">{user.displayName}</span>
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profile.photoURL || ''} alt={user.displayName || 'Avatar'} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              {user.profile.role === 'admin' && pendingUsersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in spin-in-90 fill-mode-both">
                  {pendingUsersCount}
                </span>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.profile.role === 'admin' && pendingUsersCount > 0 && (
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Users className="mr-2 h-4 w-4" />
              <span>{pendingUsersCount} Usuário(s) Pendente(s)</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Search, PlusSquare, DatabaseBackup, Users, Building, Package } from 'lucide-react';

interface MobileSidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    isCollapsed?: boolean;
    className?: string;
}

const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Cadastro de Garantia', icon: PlusSquare },
    { id: 'query', label: 'Consulta de Garantias', icon: Search },
    { id: 'lotes', label: 'Lotes de Garantia', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'persons', label: 'Clientes/Mecânicos', icon: Users },
    { id: 'suppliers', label: 'Fornecedores', icon: Building },
    { id: 'backup', label: 'Backup', icon: DatabaseBackup },
];

export default function MobileSidebar({ activeView, onNavigate, isCollapsed, className }: MobileSidebarProps) {
    return (
        <div className={className}>
            <nav className="flex flex-col gap-1 px-4">
            {mainNavItems.map(item => (
                <Button
                    key={item.id}
                    variant={activeView === item.id ? 'secondary' : 'ghost'}
                    className={cn(
                        "justify-start gap-3 text-base h-11",
                        isCollapsed && "justify-center"
                    )}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className={cn("truncate", isCollapsed && "hidden")}>{item.label}</span>
                </Button>
            ))}
            </nav>
        </div>
    )
}

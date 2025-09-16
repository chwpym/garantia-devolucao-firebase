import { LayoutDashboard, FileText, Search, PlusSquare, Users, Building, Package, FolderKanban, Wrench, Undo2, Calculator, History } from 'lucide-react';

export type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    items?: NavItem[];
}

export const navConfig: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard 
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: FolderKanban,
    items: [
        { id: 'persons', label: 'Clientes/Mecânicos', icon: Users },
        { id: 'suppliers', label: 'Fornecedores', icon: Building },
    ]
  },
  {
    id: 'garantias',
    label: 'Garantias',
    icon: Wrench,
    items: [
        { id: 'register', label: 'Cadastro de Garantia', icon: PlusSquare },
        { id: 'batch-register', label: 'Cadastro em Lote', icon: History },
        { id: 'query', label: 'Consulta de Garantias', icon: Search },
        { id: 'lotes', label: 'Lotes de Garantia', icon: Package },
    ]
  },
  {
    id: 'devolucoes',
    label: 'Devoluções',
    icon: Undo2,
    items: [
        { id: 'devolucao-register', label: 'Cadastro de Devolução', icon: PlusSquare },
        { id: 'devolucao-query', label: 'Consulta de Devoluções', icon: Search },
    ]
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: FileText,
    items: [
        { id: 'reports', label: 'Relatório de Garantias', icon: FileText },
        { id: 'devolucao-reports', label: 'Relatório de Devoluções', icon: FileText },
    ]
  },
  {
    id: 'tools',
    label: 'Ferramentas',
    icon: Calculator,
    items: [
        { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    ]
  }
];

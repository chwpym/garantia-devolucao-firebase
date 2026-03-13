
'use client';

import { LayoutDashboard, FileText, Search, PlusSquare, Users, Building, Package, FolderKanban, Wrench, Undo2, Calculator, History, Archive, BarChartHorizontal, UserCog, Settings } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  items?: NavItem[];
  adminOnly?: boolean; // New property to flag admin-only items
}

export const navConfig: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: FolderKanban,
    items: [
      { id: 'persons', label: 'Clientes/Mecânicos', icon: Users, href: '/persons' },
      { id: 'suppliers', label: 'Fornecedores', icon: Building, href: '/suppliers' },
      { id: 'products', label: 'Produtos', icon: Archive, href: '/products' },
    ]
  },
  {
    id: 'garantias',
    label: 'Garantias',
    icon: Wrench,
    items: [
      { id: 'register', label: 'Cadastro de Garantia', icon: PlusSquare, href: '/register' },
      { id: 'batch-register', label: 'Cadastro em Lote', icon: History, href: '/batch-register' },
      { id: 'query', label: 'Consulta de Garantias', icon: Search, href: '/query' },
      { id: 'lotes', label: 'Lotes de Garantia', icon: Package, href: '/lotes' },
    ]
  },
  {
    id: 'devolucoes',
    label: 'Devoluções',
    icon: Undo2,
    items: [
      { id: 'devolucao-register', label: 'Cadastro de Devolução', icon: PlusSquare, href: '/devolucao-register' },
      { id: 'devolucao-query', label: 'Consulta de Devoluções', icon: Search, href: '/devolucao-query' },
    ]
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: FileText,
    items: [
      { id: 'reports', label: 'Relatório de Garantias', icon: FileText, href: '/reports' },
      { id: 'devolucao-reports', label: 'Relatório de Devoluções', icon: FileText, href: '/devolucao-reports' },
      { id: 'product-reports', label: 'Relatórios de Produtos', icon: BarChartHorizontal, href: '/product-reports' },
    ]
  },
  {
    id: 'tools',
    label: 'Ferramentas',
    icon: Calculator,
    items: [
      { id: 'calculators', label: 'Calculadoras', icon: Calculator, href: '/calculators' },
      { id: 'reconciliation', label: 'Conciliação de Códigos', icon: History, href: '/reconciliation' },
    ]
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: UserCog,
    adminOnly: true, // This whole section is for admins
    items: [
      { id: 'users', label: 'Gerenciar Usuários', icon: Users, href: '/users' },
      { id: 'statuses', label: 'Gerenciar Status', icon: Settings, href: '/statuses' },
    ]
  }
];

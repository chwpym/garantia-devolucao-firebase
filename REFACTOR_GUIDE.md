# 📚 Guia Detalhado de Refatoração - Synergia OS

> **Versão:** 3.1 - ESTABILIDADE  
> **Data:** 28/01/2026  
> **Complemento de:** REFACTOR_PLAN.md

Este documento contém os detalhes completos de implementação de cada fase. Use em conjunto com `REFACTOR_PLAN.md` (resumo) e `REFACTOR_PROGRESS.md` (acompanhamento).

---

## 🔴 FASE 1: Correção de Erros de Hidratação

### Arquivos Afetados
1. `src/components/sections/batch-register-section.tsx`
2. `src/components/calculators/tax-analysis-calculator.tsx`
3. `src/components/calculators/purchase-simulator-calculator.tsx`
4. `src/components/calculators/cost-analysis-calculator.tsx`
5. `src/components/calculators/batch-pricing-calculator.tsx`
6. `src/components/calculators/advanced-cost-analysis-calculator.tsx`

### Problema
Uso de `Date.now()` e `Math.random()` durante SSR causa mismatch entre servidor e cliente.

### Solução
```typescript
// ❌ ANTES (causa hydration error)
const id = Date.now() + Math.random();
const uniqueKey = `item-${Math.random()}`;

// ✅ DEPOIS - Opção 1: useId (React 18+)
import { useId } from 'react';

function Component() {
  const id = useId();
  return <div id={id}>...</div>;
}

// ✅ DEPOIS - Opção 2: useState + useEffect
import { useState, useEffect } from 'react';

function Component() {
  const [uniqueId, setUniqueId] = useState<number | null>(null);
  
  useEffect(() => {
    setUniqueId(Date.now());
  }, []);
  
  if (!uniqueId) return null; // ou loading state
  
  return <div id={uniqueId}>...</div>;
}
```

### Procedimento Passo a Passo
1. Criar branch: `git checkout -b fix/hydration-errors`
2. Para cada arquivo:
   - Localizar todos os usos de `Date.now()` e `Math.random()`
   - Substituir por `useId()` ou `useState` + `useEffect`
   - Testar componente isoladamente
   - Commit: `fix: remove Date.now() from [component-name]`
3. Testar aplicação completa
4. Verificar console sem erros
5. Build: `npm run build`
6. Merge: `git checkout main && git merge fix/hydration-errors`

### Critérios de Sucesso
- [ ] Console sem "hydration mismatch"
- [ ] IDs únicos mantidos
- [ ] Funcionalidade preservada
- [ ] Build sem erros

---

## 🔴 FASE 2: Segurança da Sessão

### Arquivo Afetado
- `src/app/login/page.tsx`

### Implementação Completa

```typescript
'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (email: string, password: string) => {
    try {
      // ... lógica de autenticação
      
      const session = {
        user: authUser,
        timestamp: Date.now()
      };
      
      // Escolher storage baseado em "Lembrar de mim"
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('synergia_session', JSON.stringify(session));
      
      // Redirecionar
      window.location.replace('/');
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... outros campos ... */}
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="remember" 
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
        />
        <Label htmlFor="remember">Lembrar de mim</Label>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
```

### Critérios de Sucesso
- [ ] Checkbox funciona
- [ ] Sessão em localStorage quando marcado
- [ ] Sessão em sessionStorage quando desmarcado
- [ ] Padrão é desmarcado

---

## 🔴 FASE 3: Validador de Duplicidade

### Arquivos Afetados
- `src/components/product-form.tsx`
- `src/components/supplier-form.tsx`
- `src/components/person-form.tsx`

### Implementação - product-form.tsx

```typescript
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';

export function ProductForm({ onSave }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<Product>();
  
  const handleSave = async (data: Product) => {
    try {
      // Validar duplicidade
      const existing = await db.getProductByCode(data.codigo);
      
      if (existing && existing.id !== data.id) {
        toast({
          title: 'Produto Duplicado',
          description: `Já existe um produto com o código "${data.codigo}".`,
          variant: 'destructive'
        });
        return;
      }
      
      // Salvar se não for duplicado
      if (data.id) {
        await db.updateProduct(data);
      } else {
        await db.addProduct(data);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Produto salvo com sucesso!'
      });
      
      onSave?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar produto.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Form {...form}>
      {/* ... campos ... */}
    </Form>
  );
}
```

### Implementação - supplier-form.tsx

```typescript
const handleSave = async (data: Supplier) => {
  try {
    // Validar CNPJ duplicado
    if (data.cnpj) {
      const allSuppliers = await db.getAllSuppliers();
      const existing = allSuppliers.find(
        s => s.cnpj === data.cnpj && s.id !== data.id
      );
      
      if (existing) {
        toast({
          title: 'CNPJ Duplicado',
          description: `Já existe um fornecedor com o CNPJ "${data.cnpj}".`,
          variant: 'destructive'
        });
        return;
      }
    }
    
    // Salvar...
  } catch (error) {
    // ...
  }
};
```

### Implementação - person-form.tsx

```typescript
const handleSave = async (data: Person) => {
  try {
    // Validar CPF/CNPJ duplicado
    if (data.cpfCnpj) {
      const allPersons = await db.getAllPersons();
      const existing = allPersons.find(
        p => p.cpfCnpj === data.cpfCnpj && p.id !== data.id
      );
      
      if (existing) {
        toast({
          title: 'CPF/CNPJ Duplicado',
          description: `Já existe um cadastro com o CPF/CNPJ "${data.cpfCnpj}".`,
          variant: 'destructive'
        });
        return;
      }
    }
    
    // Salvar...
  } catch (error) {
    // ...
  }
};
```

### Critérios de Sucesso
- [ ] Toast de erro ao duplicar
- [ ] Validação antes de salvar
- [ ] Permite editar registro existente
- [ ] Mensagens claras

---

## 🟠 FASE 4: Fundações de UI e Navegação

### Arquivos Afetados
- `src/store/app-store.ts`
- `src/components/app-layout.tsx`

### Implementação - app-store.ts

```typescript
import { create } from 'zustand';

interface AppState {
  activeView: string;
  navigationHistory: string[];
  
  setActiveView: (view: string) => void;
  goBack: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'dashboard',
  navigationHistory: ['dashboard'],
  
  setActiveView: (view) => set((state) => ({
    activeView: view,
    navigationHistory: [...state.navigationHistory, view]
  })),
  
  goBack: () => set((state) => {
    const history = [...state.navigationHistory];
    history.pop(); // Remove atual
    const previousView = history[history.length - 1] || 'dashboard';
    
    return {
      activeView: previousView,
      navigationHistory: history
    };
  })
}));
```

### Implementação - app-layout.tsx

```typescript
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { navigationHistory, goBack } = useAppStore();
  const canGoBack = navigationHistory.length > 1;
  
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="flex items-center gap-2 p-4">
          {canGoBack && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <h1>Synergia OS</h1>
        </div>
      </header>
      
      <main>{children}</main>
    </div>
  );
}
```

### Critérios de Sucesso
- [ ] Navegação sem reload
- [ ] Botão "Voltar" aparece quando há histórico
- [ ] Histórico preservado
- [ ] Volta para view anterior correta

---

## 🟠 FASE 8: Dashboard Visual

### Arquivo Afetado
- `src/components/sections/dashboard-section.tsx`

### Implementação Completa

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export function DashboardSection() {
  const [topSuppliers, setTopSuppliers] = useState<Array<{name: string, count: number}>>([]);
  const [topClients, setTopClients] = useState<Array<{name: string, count: number}>>([]);
  const [recentWarranties, setRecentWarranties] = useState<Warranty[]>([]);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    const warranties = await db.getAllWarranties();
    
    // Top 5 Fornecedores
    const supplierCounts = warranties.reduce((acc, w) => {
      acc[w.fornecedor] = (acc[w.fornecedor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSupp = Object.entries(supplierCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    setTopSuppliers(topSupp);
    
    // Top 5 Clientes (similar)
    // ...
    
    // 5 Garantias Mais Recentes
    const recent = warranties
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime())
      .slice(0, 5);
    
    setRecentWarranties(recent);
  };
  
  const handleEditWarranty = (id: number) => {
    // Navegar para edição
    useAppStore.getState().handleEditWarranty(id);
  };
  
  return (
    <div className="space-y-4 p-4">
      {/* Top 5 Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSuppliers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Top 5 Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Clientes/Mecânicos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Garantias Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Garantias Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentWarranties.map((warranty) => (
                <TableRow key={warranty.id}>
                  <TableCell>{format(new Date(warranty.dataEntrada), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{warranty.cliente}</TableCell>
                  <TableCell>{warranty.produto}</TableCell>
                  <TableCell>{warranty.status}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditWarranty(warranty.id!)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Critérios de Sucesso
- [ ] Gráficos renderizam corretamente
- [ ] Dados atualizados em tempo real
- [ ] Botão "Editar" funciona
- [ ] Responsivo

---

## 🟠 FASE 11a: Gestão de Acessos e Segurança Híbrida

### Problema
Risco de acessos indevidos e poluição da interface para usuários sem privilégios administrativos.

### Solução Arquitetural
Modelo híbrido: Firebase Auth (Segurança da Credencial) + IndexedDB (Controle de Status e Perfil).

### Detalhes Técnicos
1.  **Status do Usuário**: Adicionar campo `status: 'active' | 'pending' | 'blocked'` no `UserProfile`.
2.  **Route Guard de UI**: 
    - No `AuthProvider`, se o perfil for `pending`, injetar uma flag `isPending`.
    - No `page.tsx`, se `isPending` for true, renderizar apenas o layout de "Aguardando Aprovação".

### Critérios de Sucesso
- [ ] Novos usuários não veem dados até serem aprovados.
- [ ] Admin recebe alerta visual de novos cadastros.
- [ ] Logout limpa completamente o estado da view (activeView).

---

## 🟡 FASE 18: Status Dinâmicos (COMPLEXA) ✅ (ANTECIPADA)
*(Esta fase foi movida para a Fase 11 no cronograma real para estabilizar o sistema)*

### Arquivos Afetados
- `src/lib/db.ts`
- `src/lib/types.ts`
- `src/components/sections/status-section.tsx` (novo)
- `src/components/status-form.tsx` (novo)
- `src/config/nav-config.ts`
- Todos os formulários que usam status

### Implementação - types.ts

```typescript
export interface Status {
  id?: number;
  nome: string;
  cor: string; // hex color
  aplicavelEm: ('garantia' | 'lote' | 'devolucao')[];
}
```

### Implementação - db.ts

```typescript
const STATUSES_STORE_NAME = 'statuses';

// No onupgradeneeded:
if (!dbInstance.objectStoreNames.contains(STATUSES_STORE_NAME)) {
  dbInstance.createObjectStore(STATUSES_STORE_NAME, { 
    keyPath: 'id', 
    autoIncrement: true 
  });
}

// CRUD Functions
export const addStatus = (status: Omit<Status, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STATUSES_STORE_NAME, 'readwrite');
      const request = store.add(status);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllStatuses = (): Promise<Status[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STATUSES_STORE_NAME, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Status[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const updateStatus = (status: Status): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STATUSES_STORE_NAME, 'readwrite');
      const request = store.put(status);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const deleteStatus = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STATUSES_STORE_NAME, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};
```

### Implementação - status-section.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import * as db from '@/lib/db';
import { Status } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { StatusForm } from '@/components/status-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function StatusSection() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  
  useEffect(() => {
    loadStatuses();
  }, []);
  
  const loadStatuses = async () => {
    const data = await db.getAllStatuses();
    setStatuses(data);
  };
  
  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este status?')) {
      await db.deleteStatus(id);
      loadStatuses();
    }
  };
  
  const handleSave = async () => {
    setIsDialogOpen(false);
    setEditingStatus(null);
    loadStatuses();
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gerenciar Status</h2>
        <Button onClick={() => { setEditingStatus(null); setIsDialogOpen(true); }}>
          Novo Status
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Aplicável Em</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statuses.map((status) => (
            <TableRow key={status.id}>
              <TableCell>{status.nome}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded" 
                    style={{ backgroundColor: status.cor }}
                  />
                  {status.cor}
                </div>
              </TableCell>
              <TableCell>{status.aplicavelEm.join(', ')}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(status)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(status.id!)}>
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Editar Status' : 'Novo Status'}</DialogTitle>
          </DialogHeader>
          <StatusForm status={editingStatus} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Critérios de Sucesso
- [ ] CRUD completo funciona
- [ ] Status aparecem nos selects
- [ ] Filtros por tipo funcionam
- [ ] Cores aplicadas corretamente
- [ ] Não quebra status existentes

---

**Este arquivo contém exemplos detalhados. Para resumo, veja REFACTOR_PLAN.md**

**Última Atualização:** 15/12/2025

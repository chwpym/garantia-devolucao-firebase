# 🚀 Plano Completo de Refatoração - Synergia OS

> **Versão:** 3.2 - EXPANSÃO  
> **Data Atualização:** 16/02/2026  
> **Total de Fases:** 25
> **Status:** 🟠 Em Progresso (Fase 12 - Username Auth)

---

## 📊 Análise do Projeto

### Estrutura Atual

```
src/
├── app/              6 arquivos
├── components/       91 arquivos (20 sections)
├── config/           1 arquivo
├── firebase/         1 arquivo
├── hooks/            6 arquivos
├── lib/              7 arquivos
├── store/            1 arquivo
└── types/            1 arquivo
```

### Dependências

- Next.js: 15.3.3 (⚠️ 15.5.9 disponível)
- React: 18.3.1 ✅
- Firebase: 10.12.3 ✅
- Recharts: 2.15.1 ✅

### Problemas Identificados

- 🔴 6 arquivos com erros de hidratação (`Date.now()` / `Math.random()`)
- 🟡 4 arquivos com `console.log` em produção
- 🟡 Next.js desatualizado

---

## 🎯 Resumo das Fases

| Prioridade | Fases  | Tempo Total     |
| ---------- | ------ | --------------- |
| 🔴 Crítica | 3      | 5-7 horas       |
| 🟠 Alta    | 6      | 18-24 horas     |
| 🟡 Média   | 11     | 28-36 horas     |
| 🟢 Baixa   | 4      | 9-11 horas      |
| **TOTAL**  | **24** | **60-78 horas** |

---

## 🔴 FASES CRÍTICAS (Fazer Primeiro)

### Fase 1: Correção de Erros de Hidratação

**Tempo:** 2-3 horas  
**Arquivos:** 6 calculadoras + batch-register-section.tsx  
**Objetivo:** Eliminar `Date.now()` e `Math.random()` que causam hydration errors

### Fase 2: Segurança da Sessão

**Tempo:** 1-2 horas  
**Arquivos:** `login/page.tsx`  
**Objetivo:** Checkbox "Lembrar de mim" com localStorage/sessionStorage

### Fase 3: Validador de Duplicidade

**Tempo:** 2 horas  
**Arquivos:** `product-form.tsx`, `supplier-form.tsx`, `person-form.tsx`  
**Objetivo:** Prevenir cadastros duplicados (código, CNPJ, CPF)

---

## 🟠 FASES ALTA PRIORIDADE

### Fase 4: Fundações de UI e Navegação

**Tempo:** 2-3 horas  
**Objetivo:** Navegação em abas + botão "Voltar" inteligente

### Fase 5: Usabilidade em Garantias

**Tempo:** 3-4 horas  
**Objetivo:** Cards informativos + gerenciamento em massa

### Fase 6: Busca Inteligente

**Tempo:** 3-4 horas  
**Objetivo:** Busca fuzzy + cards coloridos

### Fase 7: Melhorias de Fluxo

**Tempo:** 4-5 horas  
**Objetivo:** Cadastro rápido (botão "+") + manter filtros

### Fase 8: Dashboard Visual

**Tempo:** 3-4 horas  
**Objetivo:** Gráficos BarChart + painel de garantias recentes

### Fase 9: Otimização de Cadastro Rápido

**Tempo:** 2-3 horas  
**Objetivo:** Auto-seleção após criar item

---

## 🟡 FASES MÉDIA PRIORIDADE

### Fase 10: Performance

**Tempo:** 2-3 horas  
**Objetivo:** Virtualização de listas + lazy loading

### Fase 11: Status de Garantia ✅

**Tempo:** 2-3 horas  
**Objetivo:** Sistema de status visual com cores (CRUD Dinâmico antecipado)

### Fase 11a: Gestão de Acessos e Segurança Híbrida 🟠

**Tempo:** 3-4 horas  
**Objetivo:** Modelo Local-First com motor Firebase.

- Cadastro Pendente/Aprovação Admin.
- Badge de notificação de novos usuários.
- Reset de UI entre diferentes perfis de usuário.

### Fase 11b: Performance e Paginação ✅

**Tempo:** 2-3 horas  
**Objetivo:** Implementação de "Carregar Mais" e otimização de renderização.

### Fase 11c: Padronização Visual ✅

**Tempo:** 1-2 horas  
**Objetivo:** Unificação de StatusBadge em todo o sistema.

### Fase 11d: Código Externo ✅

**Tempo:** 2 horas  
**Objetivo:** Campo `codigoExterno` e Tela de Conciliação.

### Fase 12: Autenticação por Username

**Tempo:** 2-3 horas  
**Objetivo:** Permitir login via Username em vez de apenas e-mail.

### Fase 13: Máscara de Telefone

**Tempo:** 1 hora  
**Objetivo:** Formatação automática `(XX) XXXXX-XXXX`

### Fase 14: Múltiplos Contatos

**Tempo:** 3-4 horas  
**Objetivo:** Arrays de telefones e emails

### Fase 15: UX Telas Vazias

**Tempo:** 2 horas  
**Objetivo:** Componente EmptyState reutilizável

### Fase 16: Limpeza de Console.log

**Tempo:** 30 min  
**Objetivo:** Remover logs de produção

### Fase 17: Atualizar Next.js

**Tempo:** 1 hora  
**Objetivo:** 15.3.3 → 15.5.9

### Fase 18: Status Dinâmicos (COMPLEXA)

**Tempo:** 6-8 horas  
**Objetivo:** CRUD de status customizáveis

### Fase 19: Tempo Médio de Devolução (COMPLEXA)

**Tempo:** 4-5 horas  
**Objetivo:** Analytics de tempo de devolução por cliente

### Fase 20: Melhorias Consulta Devoluções

**Tempo:** 1-2 horas  
**Objetivo:** Hover dark mode + tooltip mecânico

---

## 🟢 FASES BAIXA PRIORIDADE (Polish)

### Fase 21: Preferências do Usuário

**Tempo:** 1 hora  
**Objetivo:** Salvar aba preferida do dashboard

### Fase 22: Remover Login Google

**Tempo:** 30 min  
**Objetivo:** Simplificar tela de login

### Fase 23: UI Polish

**Tempo:** 3-4 horas  
**Objetivo:** Consistência visual (botões, espaçamentos, tipografia)

### Fase 24: Documentação e Testes

**Tempo:** 4-5 horas  
**Objetivo:** README + JSDoc + testes básicos

---

## 🛡️ PROCEDIMENTOS DE SEGURANÇA

### Antes de Cada Fase

```bash
git checkout -b [tipo]/[nome-fase]
git pull origin main
```

### Durante a Fase

```bash
# Commits incrementais
git add [arquivo]
git commit -m "[tipo]: [descrição]"
```

### Após a Fase

```bash
npm run dev          # Testar
npm run build        # Verificar build
npm run typecheck    # Verificar tipos
git checkout main
git merge [branch]
git push origin main
```

### Rollback de Emergência

```bash
git log --oneline
git revert [commit-hash]
git push origin main
```

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

**Semana 1 - Crítico + Alta (Dias 1-5)**

1. Fase 1: Hidratação (CRÍTICO)
2. Fase 2: Segurança Sessão (CRÍTICO)
3. Fase 3: Validador (CRÍTICO)
4. Fase 4: Navegação
5. Fase 5: Usabilidade Garantias
6. Fase 6: Busca Inteligente
7. Fase 7: Melhorias de Fluxo
8. Fase 8: Dashboard Visual
9. Fase 9: Cadastro Rápido

**Semana 2 - Média + Baixa (Dias 6-10)**
10-20. Fases Média Prioridade
21-24. Fases Baixa Prioridade

---

## ✅ CHECKLIST GERAL

### Antes de Começar

- [ ] Backup completo do projeto
- [ ] Git configurado
- [ ] Ambiente funcionando
- [ ] Dependências instaladas

### Para Cada Fase

- [ ] Criar branch
- [ ] Fazer mudanças incrementais
- [ ] Testar após cada mudança
- [ ] Verificar critérios de sucesso
- [ ] Build de produção
- [ ] Merge para main

### Após Todas as Fases

- [ ] Revisão geral
- [ ] Testes de integração
- [ ] Performance check
- [ ] Deploy para produção

---

**Ver arquivo REFACTOR_PROGRESS.md para acompanhamento detalhado**

---

**Última Atualização:** 16/02/2026  
**Versão:** 3.2  
**Status:** 🟠 Fase 12 em planejamento

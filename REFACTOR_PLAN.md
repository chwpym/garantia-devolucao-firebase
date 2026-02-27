# 🚀 Plano Completo de Refatoração - Synergia OS

> **Versão:** 3.4 - NORMALIZAÇÃO E EXPANSÃO 2026
> **Data Atualização:** 25/02/2026  
> **Total de Fases:** 32
> **Status:** ✅ Fases Iniciais Concluídas. Iniciando Nova Frente 6.5 (Bugs / Usabilidade).

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

| Prioridade | Fases  | Tempo Total      |
| ---------- | ------ | ---------------- |
| 🔴 Crítica | 4      | 6-9 horas        |
| 🟠 Alta    | 7      | 22-26 horas      |
| 🟡 Média   | 12     | 30-39 horas      |
| 🟢 Baixa   | 4      | 9-11 horas       |
| 🔵 Novas   | 5      | 23-31 horas      |
| **TOTAL**  | **32** | **90-116 horas** |

---

## 🔴 FASES CRÍTICAS (Fazer Primeiro)

### Fase 1: Correção de Erros de Hidratação ✅

**Tempo:** 2-3 horas  
**Objetivo:** Eliminar `Date.now()` e `Math.random()` que causam hydration errors

### Fase 2: Segurança da Sessão ✅

**Tempo:** 1-2 horas  
**Objetivo:** Checkbox "Lembrar de mim" com localStorage/sessionStorage

### Fase 3: Validador de Duplicidade ✅

**Tempo:** 2 horas  
**Objetivo:** Prevenir cadastros duplicados (código, CNPJ, CPF)

---

## 🟠 FASES ALTA PRIORIDADE

### Fase 4: Fundações de UI e Navegação ✅

**Tempo:** 2-3 horas  
**Objetivo:** Navegação em abas + botão "Voltar" inteligente

### Fase 5: Usabilidade em Garantias ✅

**Tempo:** 3-4 horas  
**Objetivo:** Cards informativos + gerenciamento em massa

### Fase 6: Busca Inteligente ✅

**Tempo:** 3-4 horas  
**Objetivo:** Busca fuzzy + cards coloridos

### Fase 6.5: Estabilização de Bugs Críticos (Hotfixes 2026) 🐛

**Tempo:** 4-6 horas  
**Objetivo:** Curar inconsistências reportadas em Produção:

- Retenção do Input Mecânico Novo nas devoluções.
- Limpeza da Tela p/ Nulo em Busca de Cliente (Busca Fantasma), incluindo verificação de _Nome Fantasia_.
- Ajustar Busca de Lote 'Case Insensitive' (ignorar maiúscula/minúscula).
- Impedir que o Dropdown de Produto e Filtros Respondam com Bug ao Alterar Status, fazendo recarga orgânica.
- Bug do Card Lote: O Popover de Botão '...' abrindo Criador invés de Edição. Card Status visual não sendo refletido perfeitamente.
- Habilitar edição cruzada de novos Clientes nas malhas em andamento.

### Fase 6.6: Refatoração do Combobox de Produtos (Usabilidade) ✅

**Tempo:** 4-6 horas
**Objetivo:** Extirpar selects antigos e padronizar inserção de Peças

- Criar `ComboboxProduct` global com Debounce (300ms) e SmartSearch.
- Aplicar o novo componente em Garantias e Devoluções.
- Bloquear edição manual do campo "Descrição" (`readOnly`).
- Reduzir _preload_ de itens vazios de 50 para 10 (performance).

### Fase 6.7: Ajustes Visuais e de Grid (Filtros) ✅

**Tempo:** 1-2 horas
**Objetivo:** Refinamento de usabilidade nas malhas de consulta.

- Alterar grid rígido (50%) na tela de Consulta de Garantias para `flex-grow`.
- Permitir que a caixa de seleção de Cliente expanda de 200px para até 350px dinamicamente.
- Padronizar caixas de itens em Devolução para `bg-transparent` (mesmo de Garantia).

### Fase 7: Melhorias de Fluxo (Cadastros in-Loco) ⚡

**Tempo:** 4-5 horas  
**Objetivo:** Cadastro rápido (botão "+"). Abrir sub-formulários (modal) nas páginas lançadas para Clientes/Mecânicos e Fornecedores e gerar Auto-seleção pós submit. Botão "Editar Devolução" direto da ListView.

### Fase 8: Dashboard Visual 📊

**Tempo:** 3-4 horas  
**Objetivo:** Gráficos BarChart + Painéis. Adicionar funcionalidade de Expansão (Modal) dos gráficos com miniaturas/relatórios atrelados. Melhoria gráfica: Diminuir período mensal visto nas Garantias abrindo espaço focado em Gráfico Pizza (com Legenda expansível). Subir gráficos para Devoluções.

### Fase 9: Otimização de Cadastro Rápido ✅

**Tempo:** 2-3 horas  
**Objetivo:** Auto-seleção após criar item

---

## 🟡 FASES MÉDIA PRIORIDADE

### Fase 10: Performance ✅

**Tempo:** 2-3 horas  
**Objetivo:** Virtualização de listas + lazy loading

### Fase 11: Status de Garantia ✅

**Tempo:** 2-3 horas  
**Objetivo:** Sistema de status visual com cores (CRUD Dinâmico antecipado)

### Fase 11a: Gestão de Acessos e Segurança Híbrida 🟠 ✅

**Tempo:** 3-4 horas  
**Objetivo:** Modelo Local-First com motor Firebase. Cadastro Pendente Admin.

### Fase 11b: Performance e Paginação ✅

**Tempo:** 2-3 horas  
**Objetivo:** Implementação de "Carregar Mais" e otimização de renderização.

### Fase 11c: Padronização Visual ✅

**Tempo:** 1-2 horas  
**Objetivo:** Unificação de StatusBadge em todo o sistema.

### Fase 11d: Código Externo ✅

**Tempo:** 2 horas  
**Objetivo:** Campo `codigoExterno` e Tela de Conciliação. _(Aplicações Visuais Pendentes em UI -> Ver Fases 31/11d complementar)_.

### Fase 12: Autenticação por Username ✅

**Tempo:** 2-3 horas  
**Objetivo:** Permitir login via Username em vez de apenas e-mail.

### Fase 13: Máscara de Telefone ✅

**Tempo:** 1 hora  
**Objetivo:** Formatação automática `(XX) XXXXX-XXXX`

### Fase 14: Múltiplos Contatos ✅

**Tempo:** 3-4 horas  
**Objetivo:** Arrays de telefones e emails

### Fase 15: UX Telas Vazias ✅

**Tempo:** 2 horas  
**Objetivo:** Componente EmptyState reutilizável

### Fase 16: Limpeza de Console.log ✅

**Tempo:** 30 min  
**Objetivo:** Remover logs de produção

### Fase 17: Atualizar Next.js ✅

**Tempo:** 1 hora  
**Objetivo:** 15.3.3 → 15.5.9

### Fase 18: Status Dinâmicos (COMPLEXA) ✅

**Tempo:** 6-8 horas  
**Objetivo:** CRUD de status customizáveis

### Fase 19: Estabilização de Chaves e Layout ✅

**Tempo:** 2-3 horas  
**Objetivo:** Diferenciação de chaves React (Pessoas/Documento), refinamento de scrolls.

### Fase 19a: Tempo Médio de Devolução (COMPLEXA)

**Tempo:** 4-5 horas  
**Objetivo:** Analytics de tempo de devolução por cliente

### Fase 20: Melhorias Lançamentos Garantias ✅

**Tempo:** 1-2 horas  
**Objetivo:** Redesign da Lista de Lançamentos Diários com Cards e Tooltip de Hover.

### Fase 20a: Melhorias Lançamentos Devoluções ✅

**Tempo:** 1-2 horas  
**Objetivo:** Espelhar o padrão de Cards dinâmicos e Tooltips na lista diária de Devoluções.

### Fase 20b: Alerta Interativo em Tabela de Consulta ✅

**Tempo:** 1-2 horas  
**Objetivo:** Inserir Indicador visual de Mecânico na malha tabular.

### Fase 20c: Alerta Interativo em Tabela de Garantias ✅

**Tempo:** 1-2 horas  
**Objetivo:** Inserir Indicador visual de Mecânico em `warranty-table`.

---

## 🟢 FASES BAIXA PRIORIDADE (Polish)

### Fase 21: Preferências do Usuário ✅

**Tempo:** 1 hora  
**Objetivo:** Salvar aba preferida do dashboard (Garantias vs Devoluções).

### Fase 22: Remover Login Google ✅

**Tempo:** 30 min  
**Objetivo:** Simplificar tela de login.

### Fase 23: UI Polish

**Tempo:** 3-4 horas  
**Objetivo:** Consistência visual (botões, espaçamentos, tipografia)

### Fase 24: Documentação e Testes

**Tempo:** 4-5 horas  
**Objetivo:** README + JSDoc + testes básicos

---

### Fase 25: Normalização de Dados (UPPER CASE) ✅

**Tempo:** 2-3 horas  
**Objetivo:** Nomes salvos em UPPER CASE.

### Fase 26: Normalização de Status e Case-Sensitivity ✅

**Tempo:** 1-2 horas  
**Objetivo:** Remover inconsistência entre status em UPPER CASE.

### Fase 27: Geração de IDs Únicos e Sequenciais (Com Automação)

**Tempo:** 2-3 horas  
**Objetivo:** Padronizar a geração de Base-IDs para Fornecedor, Cliente e Produto. Permitir a geração e importação contínua vinculada em códigos e regras do ERP.

---

## 🔵 NOVAS FASES: AMPLIAÇÃO E REVENDA (ROADMAP 2026)

_Lógicas extras demandadas nativamente durante o uso._

### Fase 28: Importação e Conversão de PDFs/Excel Legados

**Tempo:** 4-6 horas
**Objetivo:** Ferramenta Script para compilar Base Antiga do ERP para formato JSON (Clientes, Fornecedores, Produtos) popular IndexedDB de forma não destrutiva.

### Fase 29: Exportação Sumarizada de Relatórios e Consultas

**Tempo:** 4-5 horas
**Objetivo:**

- Inserir Botão "Imprimir Peças" dinâmico na aba Consulta.
- Inteligência de Relatório: Na emissão nativa (_Gerar Relatório PDF_) das Garantias, processar produtos irmãos agrupando quantidades caso o código+descrição sejam idênticos, impedindo múltiplas linhas vazias na tabela.

### Fase 30: Padronização Kanban para Lotes de Autoria

**Tempo:** 5-7 horas
**Objetivo:**

- Adicionar Abas Nativas (Abertos, Enviados, Finalizados) com auto-migração de item por marcação finalizada.
- Borda de Cores atreladas ao Fundo de Status (Visual Rápido).
- Injeção de Campo _Observação_ Interna.
- Hover Mágico Popup: Renderizar uma miniatura de peças penduradas sem clicar e abrir modal.

### Fase 31: Bancos Relacionais (1:N) Múltiplos Códigos de Fornecedor

**Tempo:** 7-9 horas
**Objetivo:** Expandir estrutura de um Produto permitindo conectar N Códigos Locais Distintos (Cada código advindo de um Fornecedor Diferente). Validar na tela e preencher a pendência de mostrar "Código Externo" no Dashboard Pessoal de Clientes e Mecânicos.

### Fase 32: Workflow e SLA Inativo (Timer Alarmes)

**Tempo:** 3-5 horas
**Objetivo:** Adicionar configuração no Criador de Status: _Avisar SLAs (Dias)_. O sistema enviará notificações na tela (ou badge vermelho) quando uma Garantia ficar Inerte "Ex: Aguardando Autorização por +2 Dias Úteis".

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

1. **Fase 6.5:** Hotfixes de Bugs Visíveis In-Loco.
2. **Fase 7 e 8:** Expansão Analítica e Burocracia Operacional Reduzida.
3. Seguir pelo Fluxo Estrutural até Fase 27.
4. Finalizar Ciclo 2026 com Workflow SLAs e Integração Relacional (Fases 28 a 32).

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

**Última Atualização:** 25/02/2026  
**Versão:** 3.4  
**Status:** ✅ Fases iniciais Concluídas (26 Fases). Abrindo Fluxo de Bugs Diários e Novas Metas (Fase 6.5 à 32).

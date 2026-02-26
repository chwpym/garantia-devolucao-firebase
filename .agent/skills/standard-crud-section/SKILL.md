---
name: standard-crud-section
description: Padronização das abas de listagem e gestão (CRUD) no sistema.
---

# 📑 Skill: Standard CRUD Section

Esta Skill define o "DNA" de uma aba de gestão no sistema. Use-a ao criar novas seções ou refatorar listagens existentes.

## 📋 Regras de Ouro

1.  **Init DB First**: Toda section deve verificar `isDbReady` e carregar dados no `useEffect`.
2.  **Persistência de Filtros**: Use `usePersistedFilters` para que o usuário não perca a busca ao mudar de aba.
3.  **Sincronização**: Dispare e ouça o evento `datachanged` para atualização em tempo real entre componentes.
4.  **UI Consistente**: Use o padrão `Card` + `Table` com ações em `DropdownMenu`.
5.  **Tolerância a Dados Legados**: NUNCA filtre Tipologias (ex: `p.tipo === 'Cliente'`) de forma estrita de Case Sensitive sem fallbacks. Sempre adicione verificação com `.toLowerCase()` e preveja instâncias `undefined` de banco antigo para não ocultar dados (`!p.tipo || p.tipo.toLowerCase() === 'cliente'`).

## 🛠️ Padrão de Inicialização

```typescript
useEffect(() => {
  async function initialize() {
    if (!isDbReady) {
      await db.initDB();
      setIsDbReady(true);
    }
    loadData();
  }
  initialize();
}, [isDbReady, loadData]);
```

## 🔍 Como Validar

- Ao recarregar a página, os filtros de busca da aba devem ser mantidos.
- Ao salvar um item em um formulário, a lista na aba principal deve se atualizar automaticamente (via evento).

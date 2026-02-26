---
name: data-integrity-pro
description: Padronização de salvamento, restauração e integridade de dados no banco local IndexedDB.
---

# 💾 Skill: Data Integrity Pro

Esta Skill garante que operações críticas de importação e exportação de dados não deixem o sistema em um estado inconsistente.

## 📋 Regras de Ouro

### 1. Padrão "Clean Slate" (Estado Limpo)

Toda restauração de backup DEVE limpar exaustivamente todas as stores do banco de dados antes de inserir novos registros.

- **Store-Clear Checklist**: Ao adicionar um novo ObjectStore no `db.ts`, ele **deve** ser incluído na promessa de limpeza do `import-button.tsx`.

```tsx
await Promise.all([
  db.clearWarranties(),
  // ... todas as outras
  db.clearNewStore(), // Obrigatório
]);
```

### 2. Exportação Completa

O backup gerado pelo `BackupSection` deve incluir todas as entidades do sistema. Se um novo Store for criado, as funções `gatherDataForBackup` e a interface `FullBackupData` devem ser atualizadas imediatamente.

### 3. Migrações de Dados (idempotência)

Scripts de migração (ex: `runDataMigration` no `app-store.ts`) devem ser idempotentes e usar flags em `localStorage` para garantir que rodem apenas uma vez com sucesso.

### 4. Tratamento de IDs e Integridade Referencial

Sempre remova ou trate IDs de forma que o IndexedDB possa autogerenciar as chaves se necessário.

- **Delete Cascading**: Ao deletar um item pai (ex: Lote), você DEVE implementar a limpeza de seus filhos (ex: LoteItems) para evitar dados órfãos. Use transações para garantir que ambos ocorram ou falhem juntos.

## 🔍 Como Validar

- Realize um backup, mude um dado manualmente, restaure o backup e verifique se o dado voltou ao estado original sem duplicatas.
- Verifique no console se não há erros de "store not found" ou "function is not defined" durante o processo de `clearStore`.

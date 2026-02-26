---
name: db-store-manager
description: Gestão padronizada do banco de dados IndexedDB e schema centralizado.
---

# 🗄️ Skill: DB Store Manager

Esta Skill garante a integridade do arquivo `src/lib/db.ts` e a consistência dos dados.

## 📋 Regras de Ouro

1.  **Versão Única**: Nunca altere o `DB_VERSION` sem verificar o impacto nas migrations existentes.
2.  **Naming Convention**: Nomes de ObjectStores devem ser constantes (ex: `PERSONS_STORE_NAME`).
3.  **Tipagem Estrita**: Toda função de banco deve retornar ou receber tipos definidos em `types.ts`.
4.  **Tratamento de Erros**: Sempre envolva operações de banco em `try/catch` com logs descritivos.

## 🛠️ Padrão para Novo Store e Resiliência 🛡️

Ao adicionar uma nova entidade ou modificar existentes:

1. Adicione a constante do nome do Store.
2. Atualize o `onupgradeneeded` no `getDB`.
3. **Escudo de Produção**: NUNCA acesse `.result` de um `IDBRequest` diretamente fora de uma promessa ou handler. Use sempre `(event.target as IDBRequest).result` dentro de `onsuccess`.
4. **Normalização**: Use sempre `normalizeData` antes de `put`/`add` e `normalizeStatusOnRead` ao retornar listas.
5. Crie os métodos básicos: `getAll[Name]`, `add[Name]`, `update[Name]`.

## 🔍 Como Validar

- Execute o build do projeto para garantir que as mudanças na tipagem do banco não quebraram componentes em outras partes.

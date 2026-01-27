---
name: nav-routing-sync
description: Regras para manter a sincronia entre os itens de menu (config) e o roteador principal (page.tsx).
---

# 🗺️ Skill: Nav Routing Sync

Esta Skill evita que usuários cliquem em menus que não levam a lugar nenhum ou que recarregam o Dashboard por erro de mapeamento.

## 📋 Regras de Ouro

### 1. Paridade Segura de IDs
Todo `id` definido em `src/config/nav-config.ts` **DEVE** ter uma entrada correspondente no objeto `viewComponents` em `src/app/(protected)/page.tsx`.

### 2. Tratamento de Aliases (Retrocompatibilidade)
Se você precisar renomear um `id` de rota, mantenha o nome antigo como um alias no `viewComponents` para evitar que usuários com abas antigas abertas caiam em erro.
```tsx
const viewComponents = {
  statuses: StatusSection, // Novo nome
  status: StatusSection,   // Alias para retrocompatibilidade (Skill rule)
};
```

### 3. Redirecionamento Fallback
O roteador em `page.tsx` deve sempre ter um fallback para o `DashboardSection` caso uma view desconhecida seja acessada, mas isso deve emitir um `console.warn` em desenvolvimento.

### 4. Admin Guard no Menu
Se um item de menu for marcado como `adminOnly: true` no `nav-config`, certifique-se de que a lógica de renderização do menu respeita o perfil do usuário (Firestore Profile).

## 🔍 Como Validar
- Clique em todos os itens de menu lateral e subitens.
- Verifique se o título da página ou a URL interna não "pisca" ou volta para o Dashboard inesperadamente.

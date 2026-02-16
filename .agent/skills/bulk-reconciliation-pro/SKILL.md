---
name: bulk-reconciliation-pro
description: Padronização de telas de conciliação e edição em massa de campos faltantes.
---

# 🚀 Skill: Bulk Reconciliation Pro

Esta Skill define o comportamento de telas projetadas para "limpeza de dados" e preenchimento em massa.

## 📋 Regras de Ouro

1.  **Foco em Omissos**: Por padrão, a tela deve filtrar apenas registros onde o campo alvo (ex: `codigoExterno`) está vazio ou nulo.
2.  **Edição In-line**: Utilize inputs diretamente na célula da tabela para evitar cliques extras.
3.  **Debounce/Auto-save**: Prefira salvar ao sair do campo (`onBlur`) ou use um botão de "Salvar Tudo" com feedback claro de progresso.
4.  **Troca de Contexto**: Mantenha o estado da categoria (Produtos/Pessoas) visível e fácil de alternar (Tabs ou Segmented Control).
5.  **Feedback Visual**: Marque registros salvos com cores sutis (ex: borda verde momentânea) para confirmar o sucesso.

## 🛠️ Padrão de Tabela

```tsx
<TableRow>
  <TableCell>{item.descricao}</TableCell>
  <TableCell>
    <Input 
      defaultValue={item.codigoExterno} 
      onBlur={(e) => handleUpdate(item.id, e.target.value)}
      placeholder="Digite o código..."
    />
  </TableCell>
</TableRow>
```

## 🔍 Como Validar
- Ao preencher um código e trocar de categoria, o dado deve ser persistido.
- A lista deve diminuir conforme os códigos são preenchidos (se o filtro de "apenas pendentes" estiver ativo).

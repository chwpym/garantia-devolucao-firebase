# Skill: Status Visual Pro

Gestão centralizada e padronizada da exibição de status em todo o sistema Synergia OS.

## Objetivo
Eliminar a repetição de lógica de cores para status e garantir consistência visual entre tabelas, cards e dashboards.

## Regras Core

### 1. Componente Unificado
- Toda exibição de status deve utilizar o componente `StatusBadge`.
- **NUNCA** defina classes de cores manuais (`bg-amber-500`, etc.) dentro dos componentes de seção.

### 2. Mapeamento de Cores
Os status devem seguir a semântica de cores do sistema:

| Tipo | Status Exemplo | Variante/Cor |
| :--- | :--- | :--- |
| **Garantia** | Aguardando Envio | `warning` (ou Amber) |
| **Garantia** | Enviado para Análise | `accent-blue` |
| **Garantia** | Aprovada (Qualquer) | `accent-green` / `primary` |
| **Garantia** | Recusada | `destructive` |
| **Lote** | Aberto | `secondary` |
| **Lote** | Enviado | `accent-blue` |
| **Lote** | Aprovado | `accent-green` |
| **Devolução** | Recebido | `accent-blue` |
| **Devolução** | Finalizada | `accent-green` |

### 3. Implementação Técnica

O componente `StatusBadge` deve ser implementado em `src/components/ui/status-badge.tsx` e aceitar as props:
- `type`: 'warranty' | 'lote' | 'devolucao' | 'acao'
- `status`: string (o valor bruto do status)

Exemplo de uso:
```tsx
<StatusBadge type="warranty" status={warranty.status} />
```

## Benefícios
- **Consistência**: O mesmo status terá a mesma cor em qualquer tela.
- **Manutenibilidade**: Mudanças de cores ou novos status são alterados em um único lugar.
- **Prontidão**: Facilita a implementação de status dinâmicos (Fase 18).

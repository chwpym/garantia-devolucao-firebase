---
name: mask-and-format-utils
description: Centralização de máscaras e formatadores (CPF, CNPJ, Telefone).
---

# 👺 Skill: Mask & Format Utils

Esta Skill evita que funções de formatação como `formatCpfCnpj` sejam reescritas em vários componentes.

## 📋 Regras de Ouro

1.  **Centralize**: Funções de máscara devem residir em `src/lib/search-utils.ts` ou arquivo específico de utils.
2.  **Input Masking**: Aplique máscaras dinamicamente no `onChange` dos inputs.
3.  **Clean Data**: O banco de dados prefere dados limpos (apenas números). Formate apenas para exibição.
4.  **Resiliência**: Formatadores devem lidar com valores `null` ou `undefined` sem quebrar.

## 🛠️ Máscaras Recomendadas

- **CPF**: `000.000.000-00`
- **CNPJ**: `00.000.000/0000-00`
- **Telefone**: `(00) 00000-0000` ou `(00) 0000-0000`

## 🔍 Como Validar
- Edite um CPF em um formulário e mude para a tabela de listagem; a máscara deve ser idêntica.
- Insira caracteres não numéricos e confirme que a máscara os ignora ou remove.

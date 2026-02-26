---
name: string-normalization-pro
description: Regras de Ouro para padronização de caracteres e formatação em Maiúsculas (Upper Case) antes do banco.
---

# 🔠 Skill: String Normalization Pro

Esta Skill resolve a ilusão visual causada pelo CSS e garante que os dados cheguem corretos, idênticos e confiáveis ao Banco de Dados IndexedDB (e Firebase).

## 🚨 O Problema da Ilusão Visual (CSS)

Muitas vezes, adicionamos a classe `uppercase` a um `<Input>` no React.
**Isso é apenas um disfarce visual!**
O CSS engana o usuário mostrando letras maiúsculas, mas quando o React Hook Form envia o payload via Zod, o valor real subjacente (que pode conter minúsculas) é transmitido ao Banco de Dados. Isso causa graves problemas de Case-Sensitivity e Buscas (ex: procurar por "ABERTO" não acha "Aberto").

## 📋 Regras de Ouro da Normalização

### 1. Intervenção na Origem (Zod Transformations)

O melhor lugar para normalizar strings garantindo que todo formulário envie a versão estrita para o banco é no **Schema Zod** através do método `.transform()`.

**❌ ERRO COMUM (Zod Base)**

```typescript
const formSchema = z.object({
  nome: z.string().min(2, "Nome curto"),
});
// Resultado: Passa o que o usuário digitou ('joão', 'João', 'JOÃO')
```

**✅ PADRÃO EXIGIDO (Zod Transform)**

```typescript
const formSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome curto")
    .transform((val) => val.trim().toUpperCase()), // MÁGICA AQUI
});
// Resultado: Sempre sairá 'JOÃO'
```

### 2. Funções de Escrita no Banco (`db.ts`)

Como segunda camada de segurança (se um dado for inserido via script ou fora de formulário), as funções de Mutação no BD podem aplicar uma lavagem `normalizeData` se o dado não for complexo.
_(Mas evite depender SÓ do DB; o Frontend Zod é a defesa principal)._

### 3. Remoção de Acentos (Opcional - Buscas)

Para campos de busca (ex: Lotes, Peças), utilize uma função que retira acentuação (Diacritics) para a normalização de leitura cruzada.

```typescript
export const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};
```

## 🔍 Onde Validar Agora Mesmo

- Formulários de **Cliente, Produto, Mecânico, Fornecedor** e **Status**.
- Todos devem possuir o `.transform(val => val.toUpperCase())` associado às suas Strings nomeadoras.

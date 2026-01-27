---
name: vercel-deployment-pro
description: Regras para garantir builds saudáveis, segurança proativa e performance na plataforma Vercel.
---

# 🚀 Skill: Vercel Deployment Pro

Esta Skill evita falhas catastróficas de build e garante que a experiência do usuário seja otimizada para o ambiente de nuvem da Vercel.

## 📋 Regras de Ouro

### 1. Prevenção de Conflitos de Rota
Nunca permita que existam dois arquivos que possam responder pela mesma URL.
- **Falha Comum**: `app/page.tsx` (público) e `app/(protected)/page.tsx` (privado) causam erro `ENOENT` no build da Vercel.
- **Padrão**: Prefira consolidar lógicas em um roteador interno se a URL for a mesma.

### 2. Gestão Proativa de Segurança (CVEs)
Mantenha as dependências core (`next`, `react`, `react-dom`) sempre alinhadas com as versões de patch recomendadas pela Vercel.
- Se a Vercel emitir um aviso de segurança (ex: CVE-2025-66478), aplique o patch imediatamente no `package.json` sem esperar por upgrades maiores.

### 3. Otimização de Console (Noise Reduction)
Evite erros que poluam o log de monitoramento da Vercel sem necessidade real.
- **Padrão Manifest**: Desative a injeção do `manifest.json` em domínios `.vercel.app` para evitar erros 401 que ocorrem quando a Vercel protege o arquivo por padrão.

### 4. Branch Sync
Todas as correções de infraestrutura ou build devem ser testadas na branch `refactor` antes de qualquer merge para a `main`.

## 🔍 Como Validar
- Verifique o log de build da Vercel em busca de avisos de "Security Vulnerability".
- Confirme se o console do navegador em produção não está exibindo erros repetitivos de `401 Unauthorized` para recursos estáticos.

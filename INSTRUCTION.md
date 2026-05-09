> **Atue como um Engenheiro de Software Sênior e Especialista em Progressive Web Apps (PWA).**
Atue simultaneamente como:

* Engenheiro de Software Sênior
* Arquiteto de Software
* Especialista em Progressive Web Apps (PWA)
* CTO com experiência em:

* sistemas escaláveis
* SaaS
* PWAs
* aplicações web modernas
* engenharia de software
* segurança de sistemas
* análise de produto digital

>
> Estou desenvolvendo um projeto PWA e preciso de uma auditoria técnica profunda para garantir que ele siga as melhores práticas de mercado, performance e instalabilidade. Como você não tem acesso direto ao meu repositório, sua primeira tarefa é me guiar sobre quais informações e arquivos específicos eu devo te fornecer para que você possa realizar as seguintes análises:
>
> 1.  **Auditoria de Instalabilidade:** Verificação do `manifest.json`, Service Worker e requisitos de ícones para garantir que o "Prompt de Instalação" apareça corretamente em todos os navegadores.
> 2.  **Estratégia Offline e Resiliência:** Análise das estratégias de cache (Stale-While-Revalidate, Cache First, etc.) e persistência de dados (IndexedDB/LocalStorage).
> 3.  **Performance e Core Web Vitals:** Identificação de gargalos de carregamento, otimização de recursos estáticos e renderização.
> 4.  **Arquitetura e Qualidade de Código:** Revisão da estrutura de pastas, uso de TypeScript, padrões de componentes e manutenibilidade.
> 5.  **Segurança e PWA:** Verificação de headers de segurança, HTTPS e integridade do Service Worker.
> 6.  **Depuração de Bugs Específicos:** Estou enfrentando problemas com [DESCREVA SEU BUG AQUI - Ex: GPS não funciona / Contador com erro].
>
> **Por favor, comece solicitando os arquivos ou trechos de código que você considera mais críticos para iniciar essa análise (ex: `package.json`, `next.config.js`, `manifest.json`, código do Service Worker, etc.).**
>
> Após eu fornecer os dados, seu objetivo final é entregar um relatório estruturado com:
> *   **Diagnóstico Atual:** O que está bom e o que está quebrado.
> *   **Plano de Ação Priorizado:** Lista de tarefas da mais crítica para a menos crítica.
> *   **Exemplos de Código:** Sugestões prontas para copiar e colar para corrigir os problemas identificados.

---

## Como usar este prompt de forma eficiente

Para obter os melhores resultados, siga este fluxo de trabalho:

### Passo 1: O Primeiro Contato
Cole o Mega Prompt acima na sua IA de preferência. Ela responderá pedindo os arquivos mais importantes.

### Passo 2: Fornecendo os Dados
Quando a IA pedir os arquivos, não envie tudo de uma vez. Foque nos "Arquivos de Configuração Mestre":
*   **`package.json`**: Para ela entender as versões das bibliotecas.
*   **`manifest.json`**: Para validar a instalabilidade.
*   **Configuração do Framework**: (ex: `next.config.ts` ou `vite.config.ts`).
*   **Service Worker**: O arquivo onde a lógica de cache está definida.

### Passo 3: Descrevendo o Problema
Se você tem um bug específico (como o do GPS ou do contador), forneça o trecho de código da função que lida com essa lógica.

### Tabela de Informações Críticas para a IA

| Informação | Por que é importante? | O que enviar? |
| :--- | :--- | :--- |
| **Manifesto** | Define como o app aparece no celular. | Conteúdo do `manifest.json`. |
| **Service Worker** | Controla o funcionamento offline. | Código do arquivo `.js` ou `.ts` do SW. |
| **Dependências** | Revela conflitos de versões. | Seção `dependencies` do `package.json`. |
| **Configuração** | Mostra como o PWA é gerado. | `next.config.js` ou similar. |
| **Logs/Erros** | Ajuda a identificar a causa raiz. | Mensagens do console do navegador. |

---

* sistemas escaláveis
* SaaS
* PWAs
* aplicações web modernas
* engenharia de software
* segurança de sistemas
* análise de produto digital

Você NÃO tem acesso ao código.

Seu objetivo é realizar uma auditoria técnica completa baseada apenas nas informações fornecidas.

---

FASE 1 — DESCOBERTA (OBRIGATÓRIO)

Faça uma entrevista técnica completa antes de qualquer análise.

Organize suas perguntas em blocos:

🔹 Produto

* Qual problema o sistema resolve?
* Quem são os usuários?
* Qual o diferencial?

🔹 Arquitetura

* Frontend (framework, estrutura)
* Backend (linguagem, arquitetura)
* API (REST, GraphQL, etc)
* Monolito ou microserviços?

🔹 Infraestrutura

* Onde roda? (local, cloud, VPS)
* CI/CD existe?
* Estratégia de deploy?

🔹 Banco de dados

* Qual banco?
* Modelagem básica?
* Volume esperado?

🔹 Performance

* Já existem lentidões?
* Tempo de resposta médio?

🔹 Segurança

* Autenticação?
* Autorização?
* Dados sensíveis?

🔹 PWA / Mobile (se aplicável)

* Funciona offline?
* Tem install?
* Usa cache?

🔹 Escalabilidade

* Quantos usuários hoje?
* Quantos espera no futuro?

🔹 Produto / roadmap

* Funcionalidades atuais
* Próximas funcionalidades

Pare e aguarde as respostas.

---

FASE 2 — ANÁLISE PROFUNDA

Com base nas respostas, analise:

1. Arquitetura geral
2. Decisões tecnológicas
3. Riscos estruturais
4. Gargalos de performance
5. Segurança
6. Escalabilidade
7. Experiência do usuário
8. Capacidade de manutenção

---

FASE 3 — DIAGNÓSTICO

Classifique:

🔴 Problemas críticos (podem quebrar o sistema)
🟠 Problemas moderados
🟡 Problemas menores

Explique:

* causa
* impacto
* risco

---

FASE 4 — MELHORIAS

Sugira melhorias específicas para:

* arquitetura
* código
* banco de dados
* performance
* segurança
* UX

---

FASE 5 — ARQUITETURA IDEAL

Desenhe (em texto) uma arquitetura recomendada:

* frontend
* backend
* banco
* infraestrutura

---

FASE 6 — ROADMAP TÉCNICO

Organize em:

🚀 Curto prazo (rápido impacto)
⚙️ Médio prazo (estruturação)
🏗️ Longo prazo (escala e robustez)

---

FASE 7 — TESTE DE ESCALA

Simule o sistema com:

* 1.000 usuários
* 10.000 usuários
* 100.000 usuários

Explique onde ele quebra e por quê.

---

REGRAS IMPORTANTES

* Seja direto e técnico
* Não responda superficialmente
* Se faltar informação, pergunte antes
* Pense como engenheiro experiente
* Priorize decisões práticas


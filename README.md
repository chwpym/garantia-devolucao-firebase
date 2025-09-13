# Synergia OS - Sistema de Gestão Integrada

Um sistema web completo e moderno para gerenciamento de garantias, devoluções de peças e outras ferramentas, desenvolvido como um Progressive Web App (PWA) com funcionalidades offline e capacidade de instalação nativa.

## 🚀 Funcionalidades Principais

### 🔧 Módulo de Garantias
- **Cadastro Detalhado**: Registre garantias com informações de produto, defeito, cliente, fornecedor, notas fiscais e anexo de fotos.
- **Consulta Avançada**: Busque garantias por qualquer texto ou filtre por período e status.
- **Gestão de Lotes**: Agrupe garantias para envio a fornecedores, controle o status do lote, adicione NFs de saída/retorno e atualize o status de vários itens de uma vez.
- **Relatórios de Lote em PDF**: Crie relatórios profissionais de envio de lote para fornecedores, selecionando os campos que deseja exibir.

### ↩️ Módulo de Devoluções
- **Múltiplas Peças por Devolução**: Adicione vários itens em um único registro de devolução.
- **Cadastro de Devolução**: Associe devoluções a clientes, mecânicos e requisições de venda.
- **Consulta de Devoluções**: Filtre todas as devoluções por data, cliente, peça ou qualquer outro dado relevante.
- **Relatórios Analíticos**:
    - **Gerais**: Analise o volume de devoluções, ranking de peças, clientes e mecânicos.
    - **Mensal por Cliente**: Gere um extrato detalhado de devoluções por cliente, ideal para conferência financeira.

### 🗃️ Cadastros e Configurações
- **Gestão Centralizada com Busca**: Mantenha um cadastro único para Clientes, Mecânicos e Fornecedores, com uma busca inteligente que permite encontrar registros por nome, CPF/CNPJ ou telefone.
- **Backup e Restauração (JSON)**: Exporte e importe todos os dados do sistema com um único arquivo JSON.
- **Exportação Avançada (CSV)**: Crie exportações personalizadas de qualquer módulo, escolhendo exatamente quais campos incluir.
- **Dados da Empresa**: Personalize os cabeçalhos dos relatórios em PDF com as informações da sua empresa.

### 📱 Progressive Web App (PWA)
- **Funciona Offline**: Todos os dados são armazenados localmente no seu navegador usando IndexedDB, permitindo o uso sem conexão à internet.
- **Instalação Nativa**: Instale o "Synergia OS" como um aplicativo no seu computador ou celular para acesso rápido.
- **Interface Responsiva**: O design se adapta perfeitamente a desktops, tablets e celulares.

## 📋 Requisitos do Sistema

- **Navegador Moderno**: Chrome, Firefox, Safari ou Edge em versões recentes.
- **JavaScript Ativado**: Essencial para o funcionamento do sistema.
- **Espaço de Armazenamento**: Pelo menos 50MB de espaço livre no navegador para armazenamento de dados e cache offline.

## 🛠️ Instalação e Acesso

O sistema foi projetado para funcionar diretamente no navegador, sem a necessidade de instalação complexa.

1.  **Acesse o link** do aplicativo no seu navegador.
2.  Para uma melhor experiência, instale o aplicativo no seu dispositivo quando o navegador oferecer a opção (geralmente um ícone na barra de endereço ou uma notificação).

### Como Instalar o PWA
-   **No Computador (Chrome/Edge):**
    1.  Abra o site do Synergia OS.
    2.  Clique no ícone de instalação (geralmente um monitor com uma seta para baixo) na barra de endereço.
    3.  Confirme a instalação.

-   **No Celular (Android/Chrome):**
    1.  Acesse o site.
    2.  Toque no menu de três pontos no canto superior direito.
    3.  Selecione "Instalar aplicativo" ou "Adicionar à tela inicial".

-   **No Celular (iOS/Safari):**
    1.  Acesse o site.
    2.  Toque no ícone de compartilhamento (um quadrado com uma seta para cima).
    3.  Role para baixo e selecione "Adicionar à Tela de Início".

## 📖 Guia de Uso Rápido

### 1. Primeiros Passos: Cadastros
- Acesse a seção **Cadastros** no menu lateral.
- Antes de criar um novo registro, use o campo de **busca** para verificar se o cliente ou fornecedor já existe.
- Cadastre seus **Clientes/Mecânicos** e **Fornecedores**. Estes dados serão usados nos menus de seleção ao registrar garantias e devoluções.
- Em **Configurações**, preencha os dados da sua empresa para que apareçam nos relatórios em PDF.

### 2. Registrando uma Garantia
- Vá para **Garantias → Cadastro de Garantia** (ou use o atalho "Nova Garantia").
- Preencha as informações do produto, defeito, e selecione o cliente, mecânico e fornecedor.
- Anexe fotos, se necessário. As imagens são armazenadas localmente.
- Clique em "Salvar".

### 3. Gerenciando Lotes de Garantia
- Vá para **Garantias → Consulta de Garantias**. Marque as garantias que deseja agrupar e clique em "Adicionar ao Lote".
- Em **Garantias → Lotes de Garantia**, você pode criar novos lotes ou visualizar os existentes.
- Ao clicar em um lote, você pode gerenciar os itens, aplicar NFs de saída/retorno em massa e alterar o status das garantias.

### 4. Registrando uma Devolução
- Vá para **Devoluções → Cadastro de Devolução** (ou use o atalho "Nova Devolução").
- Adicione uma ou mais peças, preenchendo código, descrição e quantidade.
- Preencha as informações gerais, como cliente e requisição de venda.
- Clique em "Salvar Devolução".

### 5. Gerando Relatórios
- Acesse a seção **Relatórios** no menu lateral.
- **Relatório de Garantias**: Filtre e selecione as garantias que deseja incluir, escolha os campos e gere um PDF.
- **Relatório de Devoluções**: Use os filtros de data para análises gerais ou gere relatórios mensais específicos por cliente para conferência.

### 6. Backup
- Em **Backup**, você pode exportar todos os seus dados para um arquivo JSON para segurança.
- Use a função "Restaurar" para importar dados de um arquivo de backup. **Atenção: a restauração substitui todos os dados existentes.**

## 🔧 Tecnologias Utilizadas
- **Next.js & React**: Para uma interface de usuário moderna e reativa.
- **TypeScript**: Para um código mais seguro e robusto.
- **Tailwind CSS & Shadcn/ui**: Para um design consistente, responsivo e profissional.
- **IndexedDB**: Para armazenamento de todos os dados de forma segura e offline no seu navegador.
- **Next-PWA**: Para transformar o sistema em um Progressive Web App instalável.
- **Lucide-React**: Para ícones limpos e modernos.
- **jsPDF & jspdf-autotable**: Para a geração de relatórios em PDF.

---
*Este projeto foi desenvolvido com o auxílio do **Firebase Studio**.*

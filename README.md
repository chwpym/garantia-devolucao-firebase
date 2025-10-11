# Synergia OS - Sistema de Gestão Integrada

Um sistema web completo e moderno para gerenciamento de garantias, devoluções de peças e outras ferramentas, desenvolvido como um Progressive Web App (PWA) com funcionalidades offline, capacidade de instalação nativa e um sistema de autenticação seguro.

## 🚀 Funcionalidades Principais

### 🔐 Segurança e Gestão de Usuários
- **Sistema de Autenticação Completo**: Login com E-mail/Senha ou Google.
- **Cadastro de Usuários**: Novos usuários podem se cadastrar e começar a usar o sistema imediatamente.
- **Gerenciamento de Permissões**: O primeiro usuário registrado se torna **administrador** e pode gerenciar os demais.
- **Níveis de Acesso**:
    - **Administrador**: Acesso a todas as funcionalidades, incluindo a capacidade de editar e bloquear outros usuários.
    - **Usuário Padrão**: Acesso às funcionalidades operacionais do dia a dia.
- **Proteção de Rotas**: Seções administrativas são protegidas e acessíveis apenas por administradores.

### 🔧 Módulo de Garantias
- **Cadastro Detalhado**: Registre garantias com informações de produto, defeito, cliente, fornecedor, notas fiscais e anexo de fotos.
- **Busca Inteligente de Produtos**: Digite o código do produto e o sistema preenche a descrição automaticamente, com a opção de cadastrar novos itens na hora.
- **Cadastro em Lote**: Insira múltiplas garantias de uma só vez em uma interface de planilha, associando todas a um único fornecedor para maior agilidade.
- **Consulta Avançada**: Busque garantias por qualquer texto ou filtre por período e status.
- **Gestão de Lotes**: Agrupe garantias para envio a fornecedores, controle o status do lote, adicione NFs de saída/retorno e atualize o status de vários itens de uma vez.
- **Relatórios de Lote em PDF**: Crie relatórios profissionais de envio de lote para fornecedores, selecionando os campos que deseja exibir.

### ↩️ Módulo de Devoluções
- **Múltiplas Peças por Devolução**: Adicione vários itens em um único registro de devolução.
- **Cadastro de Devolução com Busca de Produtos**: Utilize a busca por código para preencher automaticamente a descrição das peças.
- **Consulta de Devoluções**: Filtre todas as devoluções por data, cliente, peça ou qualquer outro dado relevante.
- **Relatórios Analíticos**:
    - **Gerais**: Analise o volume de devoluções, ranking de peças, clientes e mecânicos.
    - **Mensal por Cliente**: Gere um extrato detalhado de devoluções por cliente, ideal para conferência financeira.

### 🔢 Módulo de Ferramentas e Calculadoras
- **Análise de Custo por NF-e**: Importe o XML de uma NF-e para calcular o custo final real de cada produto, incluindo impostos (IPI, ICMS-ST) e outras despesas rateadas (frete, seguro).
- **Análise de Custo Avançada**: Uma versão mais detalhada da análise de custo que permite simular o crédito de PIS/COFINS para empresas do regime Lucro Real.
- **Precificação em Lote**: Importe um XML ou insira itens manualmente para calcular o preço de venda de múltiplos produtos de uma só vez, aplicando uma margem de lucro global ou individual.
- **Comparador de NF-e**: Carregue múltiplos arquivos XML para encontrar produtos duplicados ou para buscar itens específicos em diversas notas fiscais.
- **Cálculos Rápidos**: Ferramentas para calcular preço médio, preço de venda, custo unitário e porcentagens de forma simples e direta.

### 🗃️ Cadastros e Configurações
- **Gestão Centralizada com Busca**: Mantenha um cadastro único para Clientes, Mecânicos, Fornecedores e Produtos.
- **Cadastro de Produtos**: Centralize as informações dos seus produtos (código, descrição, marca, referência) para agilizar os lançamentos.
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

### 1. Primeiro Acesso
- **Cadastre-se**: Crie sua conta usando um e-mail e senha. O primeiro usuário a se registrar será o **administrador**.
- **Login**: Acesse o sistema com suas credenciais.

### 2. Primeiros Passos: Cadastros
- Acesse a seção **Cadastros** no menu lateral.
- Cadastre seus **Produtos**, **Clientes/Mecânicos** e **Fornecedores**. Estes dados serão usados para agilizar os lançamentos.
- Em **Configurações**, preencha os dados da sua empresa para que apareçam nos relatórios em PDF.

### 3. Registrando uma Garantia
- Vá para **Garantias → Cadastro de Garantia**.
- No campo **Código**, digite o código do produto. A descrição será preenchida automaticamente se o produto já estiver cadastrado.
- Se o produto não for encontrado, um aviso aparecerá e você poderá cadastrá-lo em uma janela, sem sair da tela.
- Preencha o restante das informações e clique em "Salvar".

### 4. Gerenciando Usuários (Apenas Administradores)
- Acesse **Administração → Gerenciar Usuários**.
- Nesta tela, você pode visualizar todos os usuários, editar seus nomes, alterar seus níveis de acesso (Admin/Usuário) e bloquear/desbloquear suas contas.

### 5. Backup
- Em **Backup**, você pode exportar todos os seus dados para um arquivo JSON para segurança.
- Use a função "Restaurar" para importar dados de um arquivo de backup. **Atenção: a restauração substitui todos os dados existentes.**

## 🔧 Tecnologias Utilizadas
- **Next.js & React**: Para uma interface de usuário moderna e reativa.
- **TypeScript**: Para um código mais seguro e robusto.
- **Tailwind CSS & Shadcn/ui**: Para um design consistente, responsivo e profissional.
- **Firebase Authentication**: Para um sistema de login e gerenciamento de usuários seguro.
- **IndexedDB**: Para armazenamento de todos os dados de forma segura e offline no seu navegador.
- **Next-PWA**: Para transformar o sistema em um Progressive Web App instalável.
- **Zustand**: Para gerenciamento de estado global de forma simples e eficiente.
- **Lucide-React**: Para ícones limpos e modernos.
- **jsPDF & jspdf-autotable**: Para a geração de relatórios em PDF.
- **fast-xml-parser**: Para a análise de arquivos XML de NF-e nas calculadoras.

---
*Este projeto foi desenvolvido com o auxílio do **Firebase Studio**.*

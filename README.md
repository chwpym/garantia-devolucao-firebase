# Warranty Wise - Sistema de Controle de Garantias e Devoluções

Este é um sistema de controle de garantias e devoluções desenvolvido para rodar localmente no seu navegador, criado com o Firebase Studio. Ele permite gerenciar todo o ciclo de vida das garantias de produtos e o processo de devolução de peças, desde o cadastro até a finalização.

## Visão Geral

Warranty Wise é uma aplicação completa para pequenas e médias empresas, oficinas e autopeças que precisam de uma forma simples e eficiente de rastrear garantias e devoluções. Todos os dados são armazenados de forma segura no seu próprio navegador usando a tecnologia IndexedDB, garantindo que suas informações permaneçam privadas e acessíveis a qualquer momento, mesmo offline.

## Funcionalidades Principais

### Geral
- **Dashboard Interativo**: Visualize rapidamente estatísticas de garantias e devoluções, status, rankings e atividades recentes.
- **Gestão de Cadastros**: Mantenha um cadastro centralizado de Clientes, Mecânicos e Fornecedores.
- **Backup e Exportação Avançada**: Exporte e importe todos os dados do sistema em formato JSON. Crie exportações personalizadas de qualquer módulo para CSV, escolhendo exatamente os campos que deseja incluir.
- **Configurações da Empresa**: Personalize os cabeçalhos dos relatórios em PDF com os dados da sua empresa.

### Módulo de Garantias
- **Cadastro Detalhado de Garantias**: Registre novas garantias com informações completas, incluindo dados do produto, defeito, cliente, fornecedor, notas fiscais e anexo de fotos.
- **Consulta e Filtragem Avançada**: Encontre garantias facilmente usando a busca por texto ou filtre por período e status.
- **Gerenciamento de Lotes**: Agrupe garantias em lotes para organizar o envio para fornecedores, controle o status do lote, adicione NFs de saída/retorno e atualize status em massa.
- **Relatórios de Garantia em PDF**: Crie relatórios de envio de lote para fornecedores, selecionando os campos a serem exibidos.

### Módulo de Devoluções
- **Cadastro de Devoluções**: Registre devoluções com múltiplos itens, associando-as a um cliente, mecânico e requisição de venda.
- **Consulta de Devoluções**: Busque e filtre todas as devoluções registradas por data, cliente, peça ou qualquer outro dado.
- **Relatórios de Devolução**:
    - **Relatórios Gerais**: Analise o volume de devoluções por período, com rankings de peças mais devolvidas, clientes e mecânicos.
    - **Relatório Mensal por Cliente**: Gere um extrato detalhado de todas as devoluções de um cliente específico em um determinado mês, ideal para conferência e acerto financeiro.

## Tecnologias Utilizadas

- **Next.js**: Framework React para construção da interface.
- **React e TypeScript**: Para componentes de UI robustos e tipados.
- **Tailwind CSS e Shadcn/ui**: Para um design moderno, responsivo e consistente.
- **IndexedDB**: Para armazenamento de todos os dados localmente no navegador, sem a necessidade de um banco de dados externo.

Este projeto foi desenvolvido com o auxílio do **Firebase Studio**.

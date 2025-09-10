# Warranty Wise - Sistema de Controle de Garantias

Este é um sistema de controle de garantias desenvolvido para rodar localmente no seu navegador, criado com o Firebase Studio. Ele permite gerenciar todo o ciclo de vida das garantias de produtos, desde o cadastro até o envio para fornecedores e a finalização.

## Visão Geral

Warranty Wise é uma aplicação completa para pequenas empresas e oficinas que precisam de uma forma simples e eficiente de rastrear garantias. Todos os dados são armazenados de forma segura no seu próprio navegador usando a tecnologia IndexedDB, garantindo que suas informações permaneçam privadas e acessíveis a qualquer momento, mesmo offline.

## Funcionalidades Principais

- **Dashboard Interativo**: Visualize rapidamente as estatísticas mais importantes, como o total de garantias, status (pendentes, aprovadas, recusadas), e rankings de fornecedores e clientes.
- **Cadastro Detalhado de Garantias**: Registre novas garantias com informações completas, incluindo dados do produto, defeito, cliente, fornecedor e notas fiscais.
- **Consulta e Filtragem Avançada**: Encontre garantias facilmente usando a busca por texto ou filtre por período.
- **Gerenciamento de Lotes**: Agrupe garantias em lotes para organizar o envio para fornecedores, controle o status do lote e adicione notas fiscais de retorno.
- **Gerador de Relatórios em PDF**: Crie relatórios em PDF customizáveis para enviar aos fornecedores ou para controle interno, selecionando exatamente os campos que deseja incluir.
- **Gestão de Clientes, Mecânicos e Fornecedores**: Mantenha um cadastro centralizado de pessoas e empresas envolvidas no processo.
- **Backup e Restauração**: Exporte todos os seus dados para um arquivo JSON para backup ou importe dados para restaurar o sistema.
- **Configurações da Empresa**: Personalize os relatórios em PDF com os dados da sua empresa.

## Tecnologias Utilizadas

- **Next.js**: Framework React para construção da interface.
- **React e TypeScript**: Para componentes de UI robustos e tipados.
- **Tailwind CSS e Shadcn/ui**: Para um design moderno, responsivo e consistente.
- **IndexedDB**: Para armazenamento de todos os dados localmente no navegador, sem a necessidade de um banco de dados externo.

Este projeto foi desenvolvido com o auxílio do **Firebase Studio**.
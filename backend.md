# Arquitetura do Backend - Synergia OS

Este documento detalha a arquitetura do "backend" do sistema Synergia OS. É crucial entender que o Synergia OS opera em um modelo **offline-first**, onde o navegador do cliente atua como o principal ambiente de processamento e armazenamento de dados.

Não há um servidor de backend tradicional (como Node.js, Python, etc.) hospedando uma API REST ou GraphQL. Em vez disso, a lógica de "backend" é distribuída entre o navegador do usuário e os serviços da plataforma Firebase.

---

## Componentes Principais

A arquitetura do backend pode ser dividida em duas áreas principais:

1.  **Gerenciamento de Dados e Lógica de Negócio (Client-Side)**
2.  **Autenticação e Gerenciamento de Usuários (Firebase)**

---

### 1. Gerenciamento de Dados (Client-Side com IndexedDB)

O coração do sistema é o banco de dados **IndexedDB** embutido no navegador do usuário. Toda a informação de negócio (garantias, devoluções, clientes, produtos, etc.) é armazenada localmente.

#### Funcionalidades e Vantagens:

-   **Funcionamento Offline:** Como todos os dados estão no navegador, o sistema é 100% funcional sem conexão com a internet. O usuário pode cadastrar, consultar e editar informações a qualquer momento.
-   **Velocidade e Performance:** Acesso aos dados é praticamente instantâneo, pois não há latência de rede para operações de leitura e escrita.
-   **Privacidade:** Os dados de negócio do usuário permanecem no dispositivo dele, não sendo enviados para um servidor central, exceto em operações de backup explícitas.

#### Camada de Abstração (`src/lib/db.ts`)

Para facilitar a interação com o IndexedDB, que possui uma API de baixo nível, foi criada uma camada de abstração no arquivo `src/lib/db.ts`. Este arquivo é o **único responsável** por todas as operações de CRUD (Create, Read, Update, Delete) com o banco de dados local.

**Principais Funções do `db.ts`:**
-   `initDB()`: Inicializa o banco de dados, cria as "tabelas" (Object Stores) e define os "índices" para buscas rápidas.
-   `addWarranty()`, `getAllWarranties()`, `updateWarranty()`, `deleteWarranty()`: Funções para gerenciar o ciclo de vida dos registros de garantia.
-   `addPerson()`, `getAllPersons()`: Funções para gerenciar o cadastro de Clientes e Mecânicos.
-   `addSupplier()`, `getAllSuppliers()`: Funções para gerenciar o cadastro de Fornecedores.
-   `addLote()`, `getAllLotes()`: Funções para gerenciar Lotes de garantia.
-   `addDevolucao()`, `getAllDevolucoes()`: Funções para gerenciar o cadastro de Devoluções e seus itens.
-   `addProduct()`, `getAllProducts()`: Funções para gerenciar o catálogo de Produtos.
-   `updateCompanyData()`: Salva as informações da empresa do usuário para uso em relatórios.
-   `upsertUserProfile()`, `getUserProfile()`: Funções para salvar e recuperar os perfis de usuário (papel, status, etc.) localmente.

#### Gerenciamento de Estado Global (`src/store/app-store.ts`)

O estado global da aplicação é gerenciado com a biblioteca **Zustand**. O `app-store` mantém em memória uma cópia dos dados principais (produtos, clientes, etc.) para evitar acessos repetidos ao IndexedDB, melhorando ainda mais a performance da UI. Ele também é responsável por disparar a recarga dos dados quando uma alteração é feita (`reloadData()`), garantindo a sincronização em toda a interface.

---

### 2. Autenticação e Gestão de Usuários (Firebase)

Enquanto os dados de negócio são locais, a identidade do usuário e a segurança de acesso são gerenciadas pelo **Firebase Authentication**.

#### Funcionalidades:

-   **Provedores de Login:**
    -   **E-mail e Senha:** Permite o cadastro e login tradicional.
    -   **Google Sign-In:** Oferece uma opção de login simplificada e segura.
-   **Segurança:** O Firebase gerencia de forma segura o armazenamento de senhas, tokens de sessão e a verificação de credenciais.
-   **Persistência da Sessão:** O sistema oferece a opção "Lembrar de mim", que controla se a sessão do usuário é salva no `indexedDBLocalPersistence` (longa duração) ou no `browserSessionPersistence` (dura apenas enquanto o navegador está aberto).

#### Fluxo de Autenticação e Permissões:

1.  **Cadastro:** Um novo usuário se cadastra via Firebase Auth.
2.  **Criação de Perfil Local:** No primeiro login (`onAuthStateChanged`), o sistema verifica se um perfil local para aquele usuário existe no IndexedDB (`users` store).
3.  **Definição de Permissão:**
    *   Se nenhum usuário existir no banco local, o primeiro a se registrar é automaticamente definido com a permissão (`role`) de **`admin`**.
    *   Todos os usuários subsequentes são criados com a permissão de **`user`**.
4.  **Gerenciamento de Acesso:**
    -   O perfil local (`UserProfile`) armazena o `role` ('admin' ou 'user') e o `status` ('active' ou 'blocked').
    -   Um administrador pode alterar o `role` e o `status` de outros usuários através da tela de "Gerenciar Usuários".
    -   Componentes e seções da UI são renderizados condicionalmente com base no `role` do usuário logado.
    -   Um usuário com status `blocked` é automaticamente desconectado ao tentar fazer login.

---

### Conclusão

A arquitetura do Synergia OS é um exemplo de um **Progressive Web App (PWA)** robusto, que prioriza a experiência do usuário com funcionalidade offline completa e performance de aplicação nativa. A lógica de "backend" é inteligentemente dividida: a gestão dos dados de negócio é de responsabilidade do cliente (garantindo privacidade e velocidade), enquanto a gestão de identidade e segurança é delegada a um serviço especializado e confiável (Firebase).

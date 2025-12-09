

'use client';

export type WarrantyStatus = string; // Agora é dinâmico

export interface Warranty {
  id?: number;
  codigo?: string;
  descricao?: string;
  fornecedor?: string;
  quantidade?: number;
  defeito?: string;
  requisicaoVenda?: string;
  requisicoesGarantia?: string;
  nfCompra?: string;
  valorCompra?: string;
  cliente?: string;
  mecanico?: string;
  notaFiscalRetorno?: string;
  notaFiscalSaida?: string;
  observacao?: string;
  dataRegistro?: string;
  status?: WarrantyStatus;
  loteId?: number | null;
  photos?: string[];
}

export type PersonType = 'Cliente' | 'Mecânico' | 'Ambos';

export interface ContactInfo {
  type: string;
  value: string;
}

export interface Person {
  id?: number;
  nome: string;
  nomeFantasia?: string;
  tipo: PersonType;
  cpfCnpj?: string;
  telefones?: ContactInfo[];
  emails?: ContactInfo[];
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  observacao?: string;
  codigoExterno?: string;
}

export interface Supplier {
  id?: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cidade: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  codigoExterno?: string;
  telefones?: ContactInfo[];
  emails?: ContactInfo[];
}

export type LoteStatus = string; // Agora é dinâmico

export interface LoteAttachment {
    name: string;
    url: string; // Changed from dataUri to url
}

export interface Lote {
    id?: number;
    nome: string;
    fornecedor: string;
    dataCriacao: string;
    dataEnvio?: string;
    notaFiscalSaida?: string;
    notasFiscaisRetorno?: string;
    status: LoteStatus;
    attachments?: LoteAttachment[];
}

export interface LoteItem {
    id?: number;
    loteId: number;
    warrantyId: number;
}

export interface CompanyData {
    id?: number;
    nomeEmpresa?: string;
    cnpj?: string;
    cep?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    telefone?: string;
    email?: string;
}

export interface Product {
  id?: number;
  codigo: string;
  descricao: string;
  referencia?: string;
  marca?: string;
}

// --- Novas Estruturas para Devolução ---

export type ReturnStatus = string; // Agora é dinâmico
export type RequisitionAction = 'Alterada' | 'Excluída';

export interface Devolucao {
    id?: number;
    cliente: string;
    mecanico?: string;
    requisicaoVenda: string;
    acaoRequisicao: RequisitionAction;
    dataVenda?: string;
    dataDevolucao: string;
    status: ReturnStatus;
    observacaoGeral?: string;
}

export interface ItemDevolucao {
    id?: number;
    devolucaoId: number;
    codigoPeca: string;
    descricaoPeca: string;
    quantidade: number;
}

// --- Purchase Simulator ---
export interface NfeInfo {
    emitterName: string;
    emitterCnpj: string;
    emitterCity: string;
    nfeNumber: string;
}

export interface SimulatedItemData {
    code: string;
    description: string;
    originalQuantity: number;
    simulatedQuantity: string;
    finalUnitCost: number;
}

export interface PurchaseSimulation {
    id?: number;
    simulationName: string;
    nfeInfo: NfeInfo;
    items: SimulatedItemData[];
    originalTotalCost: number;
    simulatedTotalCost: number;
    createdAt: string;
}

// --- User Profile ---
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  status: UserStatus;
}

// --- Status Management ---
export type StatusApplicability = 'garantia' | 'lote' | 'devolucao';

export interface CustomStatus {
    id?: number;
    nome: string;
    cor: string;
    aplicavelEm: StatusApplicability[];
}

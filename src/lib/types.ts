export type WarrantyStatus = 'Em análise' | 'Aprovada' | 'Recusada' | 'Paga';

export interface Warranty {
  id?: number;
  codigo?: string;
  descricao?: string;
  fornecedor?: string;
  quantidade?: number;
  defeito?: string;
  requisicoes?: string;
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
}

export type PersonType = 'Cliente' | 'Mecânico' | 'Ambos';

export interface Person {
  id?: number;
  nome: string;
  tipo: PersonType;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
}

export interface Supplier {
  id?: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cidade: string;
}

export type LoteStatus = 'Aberto' | 'Enviado' | 'Aprovado Parcialmente' | 'Aprovado Totalmente' | 'Recusado';

export interface Lote {
    id?: number;
    nome: string;
    fornecedor: string;
    dataCriacao: string;
    dataEnvio?: string;
    notaFiscalSaida?: string;
    notasFiscaisRetorno?: string;
    status: LoteStatus;
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

export type WarrantyStatus = 'Em análise' | 'Aprovada' | 'Recusada';

export interface Warranty {
  id?: number;
  codigo?: string;
  descricao?: string;
  fornecedor?: string;
  quantidade?: number;
  defeito?: string;
  requisicaoVenda?: string;
  requisicaoGarantia?: string;
  nfCompra?: string;
  valorCompra?: string;
  cliente?: string;
  mecanico?: string;
  notaRetorno?: string;
  observacao?: string;
  dataRegistro?: string;
  status?: WarrantyStatus;
}

export type PersonType = 'Cliente' | 'Mecânico' | 'Ambos';

export interface Person {
  id?: number;
  name: string;
  type: PersonType;
}

export interface Supplier {
  id?: number;
  name: string;
}

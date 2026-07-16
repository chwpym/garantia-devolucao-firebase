
import { XMLParser } from 'fast-xml-parser';

export interface NfeHeader {
    cUF?: string;
    natOp?: string;
    mod?: string;
    serie?: string;
    nNF?: string;
    dhEmi?: string;
    chave?: string;
}

export interface NfeEmitter {
    CNPJ: string;
    xNome: string;
    xFant?: string;
    IE?: string;
    enderEmit?: {
        xLgr?: string;
        nro?: string;
        xBairro?: string;
        cMun?: string;
        xMun: string;
        UF: string;
        CEP?: string;
        cPais?: string;
        xPais?: string;
        fone?: string;
    };
    CRT?: string;
}

export interface NfeDest {
    CNPJ?: string;
    CPF?: string;
    xNome: string;
    IE?: string;
    enderDest?: {
        xLgr?: string;
        nro?: string;
        xBairro?: string;
        cMun?: string;
        xMun: string;
        UF: string;
        CEP?: string;
        cPais?: string;
        xPais?: string;
        fone?: string;
    };
}

export interface NfeTaxDetail {
    vBC?: number;
    pICMS?: number;
    vICMS?: number;
    vBCST?: number;
    pICMSST?: number;
    vICMSST?: number;
    vIPI?: number;
    pIPI?: number;
    vPIS?: number;
    pPIS?: number;
    vCOFINS?: number;
    pCOFINS?: number;
    // Reforma Tributária (IBS/CBS)
    vIBS?: number;
    pIBS?: number;
    vCBS?: number;
    pCBS?: number;
    // ST-D (Diferencial de Alíquota / ST Destino) - Placeholder para lógica futura
    vSTD?: number;
}

export interface NfeItem {
    nItem: number;
    cProd: string;
    cEAN?: string;
    xProd: string;
    NCM: string;
    CFOP: string;
    uCom: string;
    qCom: number;
    vUnCom: number;
    vProd: number;
    vFrete?: number;
    vSeg?: number;
    vDesc?: number;
    vOutro?: number;
    orig?: string;
    CST?: string;
    taxes: NfeTaxDetail;
}

export interface NfeTotals {
    vProd: number;
    vFrete: number;
    vSeg: number;
    vDesc: number;
    vOutro: number;
    vST: number;
    vIPI: number;
    vICMS: number;
    vPIS: number;
    vCOFINS: number;
    vNF: number;
    // Totais Reforma
    vIBS?: number;
    vCBS?: number;
}

export interface ParsedNfe {
    header: NfeHeader;
    emit: NfeEmitter;
    dest: NfeDest;
    items: NfeItem[];
    totals: NfeTotals;
    raw?: any; // Mantido para compatibilidade se necessário
}

/**
 * Função utilitária para garantir que um valor seja um número
 */
export function parseNumberSafe(value: any): number {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? 0 : num;
}

/**
 * Garante que o retorno seja sempre um array (útil para tags do XML que podem ser objeto único ou array)
 */
function ensureArray<T>(obj: T | T[]): T[] {
    if (obj === undefined || obj === null) return [];
    return Array.isArray(obj) ? obj : [obj];
}

/**
 * Parser Centralizado de NF-e
 */
export function parseNfeXml(xmlString: string): ParsedNfe {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        removeNSPrefix: true,
        parseAttributeValue: true
    });

    const jsonObj = parser.parse(xmlString);
    const nfeNode = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;

    if (!nfeNode) {
        throw new Error("Estrutura do XML da NF-e inválida: <infNFe> não encontrado.");
    }

    const ide = nfeNode.ide || {};
    const emit = nfeNode.emit || {};
    const dest = nfeNode.dest || {};
    const icmsTot = nfeNode.total?.ICMSTot || {};
    const ibscbsTot = nfeNode.total?.IBSCBSTot || {};

    const detList = ensureArray(nfeNode.det);
    const items: NfeItem[] = detList.map((det: any, index: number) => {
        const prod = det.prod || {};
        const imposto = det.imposto || {};

        // Lógica de extração de ICMS (Várias tags possíveis: ICMS00, ICMS10, ICMS60, etc.)
        const icmsNode = imposto.ICMS ? Object.values(imposto.ICMS)[0] as any : {};
        
        // Lógica de extração de IPI
        let ipiNode = {} as any;
        if (imposto.IPI) {
            if (imposto.IPI.IPITrib) ipiNode = imposto.IPI.IPITrib;
            else if (imposto.IPI.IPINT) ipiNode = imposto.IPI.IPINT;
        }

        // Lógica de extração de PIS/COFINS
        const pisNode = imposto.PIS ? Object.values(imposto.PIS)[0] as any : {};
        const cofinsNode = imposto.COFINS ? Object.values(imposto.COFINS)[0] as any : {};

        // Lógica de Reforma Tributária (IBS/CBS)
        // A estrutura pode variar, mas geralmente está dentro de gIBSCBS ou similar
        const ibsCbsNode = imposto.IBSCBS?.gIBSCBS || {};
        const gCbs = ibsCbsNode.gCBS || {};

        return {
            nItem: parseNumberSafe(det['@_nItem']) || (index + 1),
            cProd: String(prod.cProd || ''),
            cEAN: String(prod.cEAN || ''),
            xProd: String(prod.xProd || ''),
            NCM: String(prod.NCM || ''),
            CFOP: String(prod.CFOP || ''),
            uCom: String(prod.uCom || ''),
            qCom: parseNumberSafe(prod.qCom),
            vUnCom: parseNumberSafe(prod.vUnCom),
            vProd: parseNumberSafe(prod.vProd),
            vFrete: parseNumberSafe(prod.vFrete),
            vSeg: parseNumberSafe(prod.vSeg),
            vDesc: parseNumberSafe(prod.vDesc),
            vOutro: parseNumberSafe(prod.vOutro),
            orig: String(icmsNode?.orig ?? ''),
            CST: String(icmsNode?.CST ?? icmsNode?.CSOSN ?? ''),
            taxes: {
                vBC: parseNumberSafe(icmsNode?.vBC),
                pICMS: parseNumberSafe(icmsNode?.pICMS),
                vICMS: parseNumberSafe(icmsNode?.vICMS),
                vBCST: parseNumberSafe(icmsNode?.vBCST),
                pICMSST: parseNumberSafe(icmsNode?.pICMSST),
                vICMSST: parseNumberSafe(icmsNode?.vICMSST),
                vIPI: parseNumberSafe(ipiNode?.vIPI),
                pIPI: parseNumberSafe(ipiNode?.pIPI),
                vPIS: parseNumberSafe(pisNode?.vPIS),
                pPIS: parseNumberSafe(pisNode?.pPIS),
                vCOFINS: parseNumberSafe(cofinsNode?.vCOFINS),
                pCOFINS: parseNumberSafe(cofinsNode?.pCOFINS),
                vIBS: parseNumberSafe(ibsCbsNode?.vIBS),
                pIBS: parseNumberSafe(ibsCbsNode?.pIBS),
                vCBS: parseNumberSafe(gCbs?.vCBS),
                pCBS: parseNumberSafe(gCbs?.pCBS),
            }
        };
    });

    return {
        header: {
            cUF: String(ide.cUF || ''),
            natOp: String(ide.natOp || ''),
            mod: String(ide.mod || ''),
            serie: String(ide.serie || ''),
            nNF: String(ide.nNF || ''),
            dhEmi: String(ide.dhEmi || ''),
            chave: String(nfeNode['@_Id'] || '').replace('NFe', ''),
        },
        emit: {
            CNPJ: String(emit.CNPJ || ''),
            xNome: String(emit.xNome || ''),
            xFant: String(emit.xFant || ''),
            IE: String(emit.IE || ''),
            enderEmit: emit.enderEmit ? {
                xMun: String(emit.enderEmit.xMun || ''),
                UF: String(emit.enderEmit.UF || ''),
                xLgr: String(emit.enderEmit.xLgr || ''),
                nro: String(emit.enderEmit.nro || ''),
                xBairro: String(emit.enderEmit.xBairro || ''),
                CEP: String(emit.enderEmit.CEP || ''),
            } : undefined,
            CRT: String(emit.CRT || ''),
        },
        dest: {
            CNPJ: String(dest.CNPJ || dest.CPF || ''),
            CPF: String(dest.CPF || ''),
            xNome: String(dest.xNome || ''),
            IE: String(dest.IE || ''),
            enderDest: dest.enderDest ? {
                xMun: String(dest.enderDest.xMun || ''),
                UF: String(dest.enderDest.UF || ''),
                xLgr: String(dest.enderDest.xLgr || ''),
                nro: String(dest.enderDest.nro || ''),
                xBairro: String(dest.enderDest.xBairro || ''),
                CEP: String(dest.enderDest.CEP || ''),
            } : undefined,
        },
        items,
        totals: {
            vProd: parseNumberSafe(icmsTot.vProd),
            vFrete: parseNumberSafe(icmsTot.vFrete),
            vSeg: parseNumberSafe(icmsTot.vSeg),
            vDesc: parseNumberSafe(icmsTot.vDesc),
            vOutro: parseNumberSafe(icmsTot.vOutro),
            vST: parseNumberSafe(icmsTot.vST),
            vIPI: parseNumberSafe(icmsTot.vIPI),
            vICMS: parseNumberSafe(icmsTot.vICMS),
            vPIS: parseNumberSafe(icmsTot.vPIS),
            vCOFINS: parseNumberSafe(icmsTot.vCOFINS),
            vNF: parseNumberSafe(icmsTot.vNF),
            vIBS: parseNumberSafe(ibscbsTot.vIBS || ibscbsTot.gIBS?.vIBS),
            vCBS: parseNumberSafe(ibscbsTot.vCBS || ibscbsTot.gCBS?.vCBS),
        },
        raw: nfeNode
    };
}

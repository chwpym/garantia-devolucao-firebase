'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useNfeStore } from '@/store/use-nfe-store';
import { NfeUploader } from '@/components/nfe/NfeUploader';
import { cn, formatCurrency, formatCurrency4, formatNumber } from '@/lib/utils';
import {
    Search,
    Copy,
    Check,
    FileSearch,
    FileText,
    Hash,
    KeyRound,
    X,
    CheckSquare,
    Sparkles
} from 'lucide-react';

interface FlatXmlItem {
    uid: string;
    nItem: number;
    cProd: string;
    cEAN: string;
    xProd: string;
    NCM: string;
    CFOP: string;
    CST: string;
    orig: string;
    qCom: number;
    uCom: string;
    vUnCom: number;
    vProd: number;
    vFrete: number;
    vOutro: number;
    vBC: number;
    pICMS: number;
    vICMS: number;
    vIPI: number;
    vST: number;
    nNF: string;
    serie: string;
    dhEmiFormatted: string;
    chave: string;
    chaveFormatted: string;
    emitNome: string;
    emitCNPJ: string;
}

function formatDateBr(dhEmi?: string): string {
    if (!dhEmi) return 'N/A';
    const match = dhEmi.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return dhEmi;
}

function formatChave44(chave?: string): string {
    if (!chave) return '';
    const clean = chave.replace(/\D/g, '');
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export default function NfeItemLocatorCalculator() {
    const { allNfes, removeNfe } = useNfeStore();
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNfeChave, setSelectedNfeChave] = useState<string>('ALL');
    const [showOnlyChecked, setShowOnlyChecked] = useState(false);
    const [checkedUids, setCheckedUids] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const allItems = useMemo<FlatXmlItem[]>(() => {
        return allNfes.flatMap((nfe) => {
            const chaveClean = (nfe.header.chave || '').replace(/\D/g, '');
            const dhEmiFormatted = formatDateBr(nfe.header.dhEmi);

            return nfe.items.map((item, idx) => {
                const nItem = item.nItem || idx + 1;
                return {
                    uid: `${chaveClean || nfe.header.nNF}-${nItem}-${idx}`,
                    nItem,
                    cProd: item.cProd || '',
                    cEAN: item.cEAN || '',
                    xProd: item.xProd || '',
                    NCM: item.NCM || '',
                    CFOP: item.CFOP || '',
                    CST: item.CST || '',
                    orig: item.orig || '0',
                    qCom: item.qCom || 0,
                    uCom: item.uCom || 'UN',
                    vUnCom: item.vUnCom || 0,
                    vProd: item.vProd || 0,
                    vFrete: item.vFrete || 0,
                    vOutro: item.vOutro || 0,
                    vBC: item.taxes?.vBC || 0,
                    pICMS: item.taxes?.pICMS || 0,
                    vICMS: item.taxes?.vICMS || 0,
                    vIPI: item.taxes?.vIPI || 0,
                    vST: item.taxes?.vICMSST || 0,
                    nNF: nfe.header.nNF || 'S/N',
                    serie: nfe.header.serie || '1',
                    dhEmiFormatted,
                    chave: chaveClean,
                    chaveFormatted: formatChave44(chaveClean),
                    emitNome: nfe.emit.xNome || 'Fornecedor',
                    emitCNPJ: nfe.emit.CNPJ || ''
                };
            });
        });
    }, [allNfes]);

    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            if (selectedNfeChave !== 'ALL' && item.chave !== selectedNfeChave) {
                return false;
            }
            if (showOnlyChecked && !checkedUids[item.uid]) {
                return false;
            }
            if (!searchQuery.trim()) return true;

            const rawQuery = searchQuery.trim().toLowerCase();
            const multiTerms = rawQuery.includes(',') || rawQuery.includes(';')
                ? rawQuery.split(/[,;]+/).map((t) => t.trim()).filter(Boolean)
                : [rawQuery];

            const searchableCode = item.cProd.toLowerCase();
            const searchableCodeClean = searchableCode.replace(/[^a-z0-9]/g, '');
            const searchableDesc = item.xProd.toLowerCase();
            const searchableNf = item.nNF.toLowerCase();
            const searchableEan = item.cEAN.toLowerCase();

            return multiTerms.some((term) => {
                const termClean = term.replace(/[^a-z0-9]/g, '');
                return (
                    searchableCode.includes(term) ||
                    (termClean.length >= 3 && searchableCodeClean.includes(termClean)) ||
                    searchableDesc.includes(term) ||
                    searchableNf.includes(term) ||
                    searchableEan.includes(term)
                );
            });
        });
    }, [allItems, selectedNfeChave, showOnlyChecked, checkedUids, searchQuery]);

    const handleCopy = useCallback((text: string, label: string, idKey: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idKey);
        toast({
            title: `${label} copiado!`,
            description: text,
        });
        setTimeout(() => {
            setCopiedId((prev) => (prev === idKey ? null : prev));
        }, 1800);
    }, [toast]);

    const toggleCheck = useCallback((uid: string) => {
        setCheckedUids((prev) => ({
            ...prev,
            [uid]: !prev[uid]
        }));
    }, []);

    const checkedCount = useMemo(() => Object.values(checkedUids).filter(Boolean).length, [checkedUids]);

    const dadosAdicionaisText = useMemo(() => {
        const baseList = checkedCount > 0
            ? allItems.filter((i) => checkedUids[i.uid])
            : filteredItems;

        if (baseList.length === 0) return '';

        const uniqueNfs = Array.from(
            new Map(baseList.map((i) => [i.nNF, { nNF: i.nNF, data: i.dhEmiFormatted, chave: i.chave }])).values()
        );

        const nfsStr = uniqueNfs
            .map((nf) => `NF ${nf.nNF} (${nf.data})`)
            .join(', ');

        const totalBcIcms = baseList.reduce((acc, i) => acc + i.vBC, 0);
        const totalVlrIcms = baseList.reduce((acc, i) => acc + i.vICMS, 0);

        let text = `Mercadoria enviada para avaliação de garantia (CFOP 5949). NF(s) de Origem: ${nfsStr}.`;
        if (totalBcIcms > 0 || totalVlrIcms > 0) {
            text += ` Total Base ICMS Origem: ${formatCurrency(totalBcIcms)} | Valor ICMS Origem: ${formatCurrency(totalVlrIcms)}.`;
        }
        return text;
    }, [allItems, filteredItems, checkedUids, checkedCount]);

    return (
        <div className="space-y-2.5 animate-in fade-in duration-300">
            {/* Barra Única Compacta: Busca + Conferidos + Uploader + Chips de Notas */}
            <Card className="border border-border shadow-sm rounded-xl bg-card">
                <CardContent className="p-2.5 space-y-2">
                    <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center justify-between">
                        {/* Campo de Busca Compacto */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar Código (F000KE0P05), vários códigos por vírgula (CE10103, 343328), Descrição ou Nº NF..."
                                className="pl-8 pr-8 h-8 font-semibold text-xs bg-background border-border focus-visible:ring-primary rounded-lg"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title="Limpar busca"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Ações Lado a Lado */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {allNfes.length > 0 && (
                                <>
                                    <Button
                                        variant={showOnlyChecked ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setShowOnlyChecked((prev) => !prev)}
                                        className="h-8 px-2.5 rounded-lg font-bold text-xs gap-1.5"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        Conferidos ({checkedCount})
                                    </Button>
                                    {checkedCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCheckedUids({})}
                                            className="h-8 px-2 rounded-lg font-bold text-xs text-muted-foreground hover:text-destructive"
                                            title="Desmarcar todos"
                                        >
                                            Limpar
                                        </Button>
                                    )}
                                </>
                            )}
                            <NfeUploader hideSelector />
                        </div>
                    </div>

                    {/* Chips das Notas Carregadas + Contagem na mesma linha */}
                    {allNfes.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border/50">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    NFs ({allNfes.length}):
                                </span>
                                <Badge
                                    variant={selectedNfeChave === 'ALL' ? 'default' : 'outline'}
                                    onClick={() => setSelectedNfeChave('ALL')}
                                    className="cursor-pointer h-5 px-2 rounded-md font-bold text-xs uppercase transition-all"
                                >
                                    Todas ({allItems.length})
                                </Badge>
                                {allNfes.map((nfe) => {
                                    const chaveClean = (nfe.header.chave || '').replace(/\D/g, '');
                                    const isSelected = selectedNfeChave === chaveClean;
                                    return (
                                        <div
                                            key={chaveClean || nfe.header.nNF}
                                            className="inline-flex items-center rounded-md border border-border overflow-hidden bg-muted/30"
                                        >
                                            <button
                                                onClick={() => setSelectedNfeChave(isSelected ? 'ALL' : chaveClean)}
                                                className={`h-5 px-2 text-xs font-bold uppercase flex items-center gap-1 transition-colors whitespace-nowrap ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                <FileText className="w-2.5 h-2.5 shrink-0" />
                                                NF {nfe.header.nNF}
                                                <span className="opacity-70 text-xs">({formatDateBr(nfe.header.dhEmi)})</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (isSelected) setSelectedNfeChave('ALL');
                                                    removeNfe(nfe.header.chave || '');
                                                }}
                                                title={`Remover NF ${nfe.header.nNF}`}
                                                className="h-5 px-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <span className="text-xs font-semibold text-muted-foreground ml-auto">
                                Exibindo <strong className="text-foreground">{filteredItems.length}</strong> de {allItems.length} itens • Clique no <strong className="text-primary"># Item</strong> ou <strong className="text-primary">Chave</strong> p/ copiar
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {allNfes.length > 0 ? (
                <>
                    {/* Tabela Principal Densa, Dinâmica e Balanceada */}
                    <div className="rounded-xl border border-border shadow-md overflow-hidden bg-card">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/70">
                                    <TableRow className="border-b border-border h-8">
                                        <TableHead className="w-[38px] py-1.5 px-2 text-center text-xs font-semibold uppercase text-muted-foreground">OK</TableHead>
                                        <TableHead className="w-[68px] py-1.5 px-2 text-center text-xs font-semibold uppercase text-primary whitespace-nowrap">
                                            # XML
                                        </TableHead>
                                        <TableHead className="w-[130px] py-1.5 px-2 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                                            Cód. Fabricante
                                        </TableHead>
                                        <TableHead className="w-[28%] max-w-[290px] py-1.5 px-2 text-xs font-semibold uppercase text-muted-foreground">
                                            Descrição do Produto (XML)
                                        </TableHead>
                                        <TableHead className="min-w-[205px] py-1.5 px-3 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                                            NF Origem / Data
                                        </TableHead>
                                        <TableHead className="min-w-[235px] py-1.5 px-2 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                                            Chave de Acesso (44 Díg.)
                                        </TableHead>
                                        <TableHead className="w-[140px] py-1.5 px-2 text-right text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                                            Qtde / Preço Un.
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => {
                                            const isChecked = !!checkedUids[item.uid];
                                            return (
                                                <TableRow
                                                    key={item.uid}
                                                    onClick={() => toggleCheck(item.uid)}
                                                    className={cn(
                                                        "transition-all duration-200 border-b border-border/50 cursor-pointer",
                                                        isChecked
                                                            ? "bg-muted/20 opacity-45 hover:opacity-65"
                                                            : "hover:bg-muted/30"
                                                    )}
                                                >
                                                    {/* Checkbox Estilo Checklist (Verde quando marcado) */}
                                                    <TableCell
                                                        className="py-1.5 px-2 text-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggleCheck(item.uid)}
                                                            aria-label={`Marcar item ${item.cProd}`}
                                                            className="h-4 w-4 rounded data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white"
                                                        />
                                                    </TableCell>

                                                    {/* Posição do Item no XML (nItem) */}
                                                    <TableCell
                                                        className="py-1.5 px-2 text-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleCopy(String(item.nItem), 'Nº do Item XML', `nitem-${item.uid}`)}
                                                                        className={cn(
                                                                            "inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md font-mono text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap",
                                                                            isChecked
                                                                                ? "bg-muted text-muted-foreground line-through"
                                                                                : "bg-primary text-primary-foreground"
                                                                        )}
                                                                    >
                                                                        <Hash className="w-3 h-3 opacity-80 shrink-0" />
                                                                        {item.nItem}
                                                                        {copiedId === `nitem-${item.uid}` && (
                                                                            <Check className="w-3 h-3 ml-0.5 shrink-0" />
                                                                        )}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs font-bold">
                                                                    Posição no XML (&lt;det nItem=&quot;{item.nItem}&quot;&gt;) — Clique p/ copiar
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableCell>

                                                    {/* Código do Fabricante + NCM */}
                                                    <TableCell
                                                        className="py-1.5 px-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span
                                                                className={cn(
                                                                    "font-mono text-xs font-semibold break-all leading-tight",
                                                                    isChecked ? "line-through text-muted-foreground" : "text-primary"
                                                                )}
                                                            >
                                                                {item.cProd}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(item.cProd, 'Código do Produto', `cprod-${item.uid}`)}
                                                                className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded shrink-0"
                                                                title="Copiar código"
                                                            >
                                                                {copiedId === `cprod-${item.uid}` ? (
                                                                    <Check className="w-3 h-3 text-accent-green" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <span className={cn("text-xs font-mono text-muted-foreground block leading-none mt-0.5", isChecked && "line-through")}>
                                                            NCM: {item.NCM}
                                                        </span>
                                                    </TableCell>

                                                    {/* Descrição do Produto (XML) com largura equilibrada */}
                                                    <TableCell className="py-1.5 px-2 max-w-[290px]">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span
                                                                className={cn(
                                                                    "text-xs font-bold leading-tight truncate",
                                                                    isChecked ? "line-through text-muted-foreground" : "text-foreground"
                                                                )}
                                                                title={item.xProd}
                                                            >
                                                                {item.xProd}
                                                            </span>
                                                            <div className="flex flex-wrap items-center gap-1">
                                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1 rounded">
                                                                    Orig:{item.orig}
                                                                </span>
                                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1 rounded">
                                                                    CST:{item.CST}
                                                                </span>
                                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1 rounded">
                                                                    CFOP:{item.CFOP}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* NF de Origem, Série e Emissão (Sem quebrar linha no número da NF) */}
                                                    <TableCell className="py-1.5 px-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 flex-nowrap">
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center font-mono text-xs font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0",
                                                                    isChecked
                                                                        ? "bg-muted text-muted-foreground line-through"
                                                                        : "bg-foreground text-background"
                                                                )}
                                                            >
                                                                NF {item.nNF}
                                                            </span>
                                                            <span className={cn("text-xs font-bold text-muted-foreground whitespace-nowrap shrink-0", isChecked && "line-through")}>
                                                                S:{item.serie}
                                                            </span>
                                                            <span className={cn("text-xs font-semibold text-muted-foreground whitespace-nowrap shrink-0", isChecked && "line-through")}>
                                                                {item.dhEmiFormatted}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                "text-xs text-muted-foreground/80 truncate block max-w-[195px] mt-0.5",
                                                                isChecked && "line-through"
                                                            )}
                                                            title={item.emitNome}
                                                        >
                                                            {item.emitNome}
                                                        </span>
                                                    </TableCell>

                                                    {/* Chave de Acesso Compacta Copiável */}
                                                    <TableCell
                                                        className="py-1.5 px-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {item.chave ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleCopy(item.chave, `Chave da NF ${item.nNF}`, `chave-${item.uid}`)}
                                                                    className="inline-flex items-center gap-1 h-5 px-2 rounded border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 text-xs font-semibold shrink-0 transition-colors"
                                                                    title="Copiar os 44 dígitos da Chave de Acesso"
                                                                >
                                                                    {copiedId === `chave-${item.uid}` ? (
                                                                        <>
                                                                            <Check className="w-2.5 h-2.5 text-accent-green" />
                                                                            Copiada
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <KeyRound className="w-2.5 h-2.5" />
                                                                            Copiar
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <span
                                                                    className={cn(
                                                                        "font-mono text-xs text-muted-foreground select-all leading-tight break-all",
                                                                        isChecked && "line-through"
                                                                    )}
                                                                >
                                                                    {item.chave}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Sem chave</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Quantidade e Preço Unitário */}
                                                    <TableCell className="py-1.5 px-2 text-right whitespace-nowrap">
                                                        <div className="flex flex-col items-end leading-tight">
                                                            <span
                                                                className={cn(
                                                                    "text-xs font-mono font-semibold",
                                                                    isChecked ? "line-through text-muted-foreground" : "text-foreground"
                                                                )}
                                                            >
                                                                {formatCurrency4(item.vUnCom)} <span className="text-xs text-muted-foreground font-semibold">({formatNumber(item.qCom)} {item.uCom})</span>
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "text-xs font-mono font-bold",
                                                                    isChecked ? "line-through text-muted-foreground" : "text-primary"
                                                                )}
                                                            >
                                                                Tot: {formatCurrency(item.vProd)}
                                                                {item.vICMS > 0 ? ` | ICMS: ${formatCurrency(item.vICMS)}` : ''}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-semibold text-xs">
                                                Nenhum item encontrado para o filtro informado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Barra Compacta de Dados Adicionais */}
                    {dadosAdicionaisText && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="text-xs font-semibold uppercase text-primary shrink-0">
                                    Dados Adicionais (CFOP 5949):
                                </span>
                                <span className="text-xs font-mono text-foreground truncate select-all" title={dadosAdicionaisText}>
                                    {dadosAdicionaisText}
                                </span>
                            </div>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleCopy(dadosAdicionaisText, 'Dados Adicionais', 'dados-adicionais')}
                                className="rounded-lg font-bold text-xs h-7 px-2.5 shrink-0 gap-1"
                            >
                                {copiedId === 'dados-adicionais' ? (
                                    <>
                                        <Check className="w-3 h-3" /> Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" /> Copiar Texto
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-2xl bg-muted/20 border-border text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <FileSearch className="w-6 h-6 text-primary opacity-70" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Importe os XMLs das Notas de Compra</h3>
                    <p className="text-xs text-muted-foreground max-w-md mt-1 font-medium">
                        Selecione vários arquivos XML de uma só vez para buscar peças instantaneamente e copiar o <code className="text-primary font-bold">nItem</code> e a Chave de Acesso.
                    </p>
                </div>
            )}
        </div>
    );
}

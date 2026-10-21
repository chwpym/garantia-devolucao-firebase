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
import { formatCurrency, formatCurrency4, formatNumber } from '@/lib/utils';
import {
    Search,
    Copy,
    Check,
    FileSearch,
    FileText,
    Hash,
    KeyRound,
    Calendar,
    X,
    CheckSquare,
    Sparkles,
    Trash2
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
    // Dados da NF de Origem
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
    // Tenta extrair YYYY-MM-DD
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

    // Achata todos os itens de todos os XMLs carregados
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

    // Filtragem rápida (suporta busca simples ou múltiplos códigos separados por vírgula / espaço / quebra de linha)
    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            if (selectedNfeChave !== 'ALL' && item.chave !== selectedNfeChave) {
                return false;
            }
            if (showOnlyChecked && !checkedUids[item.uid]) {
                return false;
            }
            if (!searchQuery.trim()) return true;

            // Se o usuário separar por vírgula ou ponto-e-vírgula, fazemos OR entre os termos (modo lista de peças da autorização)
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

    // Texto automático para Dados Adicionais (conforme exigência das Solicitações de Garantia)
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabeçalho Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <FileSearch className="w-6 h-6 text-primary" />
                        Localizador de Item & Referência XML (Multi-NF)
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-black opacity-70">
                        Encontre a posição exata do item (<code className="text-primary">nItem</code>), Chave de Acesso e dados de origem em múltiplos XMLs
                    </p>
                </div>
                <NfeUploader />
            </div>

            {allNfes.length > 0 ? (
                <>
                    {/* Barra de Filtro Rápido + Chips das Notas Carregadas */}
                    <Card className="border border-border shadow-md rounded-2xl bg-card">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar por Código (ex: F000KE0P05), vários códigos separados por vírgula (CE10103, 343328), Descrição ou Nº da NF..."
                                        className="pl-10 pr-9 h-11 font-bold text-sm bg-background border-border focus-visible:ring-primary rounded-xl"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            title="Limpar busca"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant={showOnlyChecked ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setShowOnlyChecked((prev) => !prev)}
                                        className="h-11 px-4 rounded-xl font-black text-xs gap-2"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Conferidos ({checkedCount})
                                    </Button>
                                    {checkedCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCheckedUids({})}
                                            className="h-11 px-3 rounded-xl font-black text-xs text-muted-foreground hover:text-destructive"
                                            title="Desmarcar todos"
                                        >
                                            Limpar Seleção
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Filtro Rápido por NF-e carregada */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1">
                                    Notas Carregadas ({allNfes.length}):
                                </span>
                                <Badge
                                    variant={selectedNfeChave === 'ALL' ? 'default' : 'outline'}
                                    onClick={() => setSelectedNfeChave('ALL')}
                                    className="cursor-pointer h-7 px-3 rounded-lg font-black text-[10px] uppercase transition-all"
                                >
                                    Todas ({allItems.length} itens)
                                </Badge>
                                {allNfes.map((nfe) => {
                                    const chaveClean = (nfe.header.chave || '').replace(/\D/g, '');
                                    const isSelected = selectedNfeChave === chaveClean;
                                    return (
                                        <div
                                            key={chaveClean || nfe.header.nNF}
                                            className="inline-flex items-center rounded-lg border border-border overflow-hidden bg-muted/30"
                                        >
                                            <button
                                                onClick={() => setSelectedNfeChave(isSelected ? 'ALL' : chaveClean)}
                                                className={`h-7 px-2.5 text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted text-foreground'
                                                }`}
                                            >
                                                <FileText className="w-3 h-3" />
                                                NF {nfe.header.nNF}
                                                <span className="opacity-70">({formatDateBr(nfe.header.dhEmi)})</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (isSelected) setSelectedNfeChave('ALL');
                                                    removeNfe(nfe.header.chave || '');
                                                }}
                                                title={`Remover NF ${nfe.header.nNF}`}
                                                className="h-7 px-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabela de Resultados Otimizada para o ERP ("Documento Fiscal Referenciado") */}
                    <div className="rounded-2xl border border-border shadow-xl overflow-hidden bg-card">
                        <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                Exibindo <strong className="text-foreground">{filteredItems.length}</strong> de {allItems.length} itens nas {allNfes.length} NF-es
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground">
                                Dica: Clique na <strong className="text-primary">Posição XML</strong> ou na <strong className="text-primary">Chave de Acesso</strong> para copiar em 1 clique.
                            </span>
                        </div>

                        <div className="overflow-x-auto max-h-[60vh]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                                    <TableRow className="border-b border-border">
                                        <TableHead className="w-[44px] text-center text-[10px] font-black uppercase text-muted-foreground">OK</TableHead>
                                        <TableHead className="w-[100px] text-center text-[10px] font-black uppercase text-primary">
                                            Nº Item XML
                                        </TableHead>
                                        <TableHead className="w-[150px] text-[10px] font-black uppercase text-muted-foreground">
                                            Cód. Fabricante
                                        </TableHead>
                                        <TableHead className="min-w-[260px] text-[10px] font-black uppercase text-muted-foreground">
                                            Descrição do Produto (XML)
                                        </TableHead>
                                        <TableHead className="w-[150px] text-[10px] font-black uppercase text-muted-foreground">
                                            NF Origem / Emissão
                                        </TableHead>
                                        <TableHead className="min-w-[240px] text-[10px] font-black uppercase text-muted-foreground">
                                            Chave de Acesso (44 Dígitos)
                                        </TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground">
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
                                                    className={`transition-colors border-b border-border/60 ${
                                                        isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'
                                                    }`}
                                                >
                                                    {/* Checkbox de Conferência */}
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggleCheck(item.uid)}
                                                            aria-label={`Marcar item ${item.cProd}`}
                                                        />
                                                    </TableCell>

                                                    {/* Posição do Item no XML (nItem) em Destaque */}
                                                    <TableCell className="text-center">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleCopy(String(item.nItem), 'Nº do Item XML', `nitem-${item.uid}`)}
                                                                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-black shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                                    >
                                                                        <Hash className="w-3.5 h-3.5 opacity-80" />
                                                                        {item.nItem}
                                                                        {copiedId === `nitem-${item.uid}` && (
                                                                            <Check className="w-3.5 h-3.5 ml-0.5" />
                                                                        )}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-[11px] font-black">
                                                                    Ordem do Item no XML (&lt;det nItem=&quot;{item.nItem}&quot;&gt;) — Clique para copiar
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableCell>

                                                    {/* Código do Fabricante */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-xs font-black text-primary break-all">
                                                                {item.cProd}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(item.cProd, 'Código do Produto', `cprod-${item.uid}`)}
                                                                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                                                                title="Copiar código"
                                                            >
                                                                {copiedId === `cprod-${item.uid}` ? (
                                                                    <Check className="w-3 h-3 text-accent-green" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-[9px] font-mono text-muted-foreground font-bold">
                                                                NCM: {item.NCM}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Descrição Completa do Produto */}
                                                    <TableCell>
                                                        <p className="text-xs font-black text-foreground leading-snug">
                                                            {item.xProd}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                                                                Orig: {item.orig}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                                                                CST: {item.CST}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                                                                CFOP Orig: {item.CFOP}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>

                                                    {/* Dados da NF de Origem (Número, Série, Emissão) */}
                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <Badge className="bg-foreground text-background hover:bg-foreground/90 font-mono text-[11px] font-black px-2 py-0 h-5 rounded-md">
                                                                    NF {item.nNF}
                                                                </Badge>
                                                                <span className="text-[10px] font-black text-muted-foreground">
                                                                    Série {item.serie}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Calendar className="w-3 h-3 opacity-70" />
                                                                {item.dhEmiFormatted}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/80 truncate max-w-[140px]" title={item.emitNome}>
                                                                {item.emitNome}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Chave de Acesso Copiável em 1 Clique */}
                                                    <TableCell>
                                                        {item.chave ? (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-mono text-[10px] font-bold text-foreground/90 tracking-tight select-all">
                                                                    {item.chaveFormatted}
                                                                </span>
                                                                <div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleCopy(item.chave, `Chave da NF ${item.nNF}`, `chave-${item.uid}`)}
                                                                        className="h-6 px-2 text-[10px] font-black rounded-lg border-primary/30 text-primary hover:bg-primary/10 gap-1"
                                                                    >
                                                                        {copiedId === `chave-${item.uid}` ? (
                                                                            <>
                                                                                <Check className="w-3 h-3 text-accent-green" />
                                                                                Chave Copiada!
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <KeyRound className="w-3 h-3" />
                                                                                Copiar Chave (44 díg.)
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Sem chave</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Quantidade, Preço Unitário e Impostos de Origem */}
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="text-xs font-mono font-black text-foreground">
                                                                {formatCurrency4(item.vUnCom)} <span className="text-[10px] text-muted-foreground font-bold">({formatNumber(item.qCom)} {item.uCom})</span>
                                                            </span>
                                                            <span className="text-[10px] font-mono font-bold text-primary">
                                                                Total: {formatCurrency(item.vProd)}
                                                            </span>
                                                            {(item.vICMS > 0 || item.vOutro > 0 || item.vFrete > 0) && (
                                                                <span className="text-[9px] font-mono text-muted-foreground">
                                                                    {item.vICMS > 0 ? `ICMS: ${formatCurrency(item.vICMS)} (${item.pICMS}%) ` : ''}
                                                                    {item.vOutro > 0 ? `| Desp: ${formatCurrency(item.vOutro)}` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-bold text-sm">
                                                Nenhum item encontrado para o filtro informado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Gerador Automático de Texto para Dados Adicionais da NF de Garantia */}
                    {dadosAdicionaisText && (
                        <Card className="border border-primary/20 bg-primary/5 rounded-2xl shadow-sm">
                            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                            Sugestão Automática para Dados Adicionais (CFOP 5949 / Garantia)
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono font-bold text-foreground bg-background/80 p-2.5 rounded-xl border border-border select-all">
                                        {dadosAdicionaisText}
                                    </p>
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleCopy(dadosAdicionaisText, 'Dados Adicionais', 'dados-adicionais')}
                                    className="rounded-xl font-black text-xs h-10 px-4 shrink-0 gap-2"
                                >
                                    {copiedId === 'dados-adicionais' ? (
                                        <>
                                            <Check className="w-4 h-4" /> Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" /> Copiar Dados Adicionais
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-border text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <FileSearch className="w-8 h-8 text-primary opacity-70" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Importe os XMLs das Notas de Compra</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-2 font-medium">
                        Você pode selecionar vários arquivos XML de uma só vez (ex: as 7 notas da Solicitação de Garantia) para buscar peças instantaneamente e ver a posição exata do item no XML (<code className="text-primary font-bold">nItem</code>) e a Chave de Acesso.
                    </p>
                </div>
            )}
        </div>
    );
}

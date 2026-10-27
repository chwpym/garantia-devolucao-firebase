'use client';

import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    FileText,
    Upload,
    Download,
    Eye,
    Trash2,
    CheckCircle2,
    FileCode2,
    Sparkles,
    Printer
} from 'lucide-react';

const ORGAO_IBGE_MAP: Record<string, string> = {
    '11': '11 - RONDÔNIA',
    '12': '12 - ACRE',
    '13': '13 - AMAZONAS',
    '14': '14 - RORAIMA',
    '15': '15 - PARÁ',
    '16': '16 - AMAPÁ',
    '17': '17 - TOCANTINS',
    '21': '21 - MARANHÃO',
    '22': '22 - PIAUÍ',
    '23': '23 - CEARÁ',
    '24': '24 - RIO GRANDE DO NORTE',
    '25': '25 - PARAÍBA',
    '26': '26 - PERNAMBUCO',
    '27': '27 - ALAGOAS',
    '28': '28 - SERGIPE',
    '29': '29 - BAHIA',
    '31': '31 - MINAS GERAIS',
    '32': '32 - ESPÍRITO SANTO',
    '33': '33 - RIO DE JANEIRO',
    '35': '35 - SÃO PAULO',
    '41': '41 - PARANÁ',
    '42': '42 - SANTA CATARINA',
    '43': '43 - RIO GRANDE DO SUL',
    '50': '50 - MATO GROSSO DO SUL',
    '51': '51 - MATO GROSSO',
    '52': '52 - GOIÁS',
    '53': '53 - DISTRITO FEDERAL',
    '90': '90 - AMBIENTE NACIONAL (SVRS)',
    '91': '91 - AMBIENTE NACIONAL',
};

const CONDICOES_USO_PADRAO =
    'A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.';

export interface CceParsedData {
    cOrgao: string;
    orgaoLabel: string;
    tpAmb: string;
    ambienteLabel: string;
    versao: string;
    chNFe: string;
    nNF: string;
    serie: string;
    idEvento: string;
    cnpjAutor: string;
    cnpjDest: string;
    emailDest: string;
    dhEvento: string;
    dhEventoFormatted: string;
    tpEvento: string;
    tipoEventoLabel: string;
    nSeqEvento: string;
    descEvento: string;
    verEvento: string;
    xCorrecao: string;
    xCondUso: string;
    cStat: string;
    xMotivo: string;
    mensagemAutorizacao: string;
    nProt: string;
    dhRegEvento: string;
    dhRegEventoFormatted: string;
    verAplic: string;
    eventoXmlBlock?: string;
    retEventoXmlBlock?: string;
    hasPed: boolean;
    hasRec: boolean;
}

function formatCnpjCpf(val?: string): string {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (clean.length === 14) {
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (clean.length === 11) {
        return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return val;
}

function formatSefazDateTime(isoStr?: string): string {
    if (!isoStr) return '';
    // Ex: 2026-10-27T10:48:27-03:00 -> 27/10/2026 às 10:48:27-03:00
    const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})(.*)$/);
    if (match) {
        return `${match[3]}/${match[2]}/${match[1]} às ${match[4]}${match[5] || ''}`;
    }
    return isoStr;
}

function extractTagValue(xml: string, tag: string): string {
    const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function extractAttrValue(xml: string, tag: string, attr: string): string {
    const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function extractBlock(xml: string, tag: string): string {
    const regex = new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:\\w+:)?${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[0].trim() : '';
}

function parseNfeKeyInfo(chNFe: string): { serie: string; nNF: string } {
    const clean = chNFe.replace(/\D/g, '');
    if (clean.length !== 44) return { serie: '', nNF: '' };
    const serie = String(parseInt(clean.slice(22, 25), 10));
    const nNFNum = parseInt(clean.slice(25, 34), 10);
    const nNF = isNaN(nNFNum) ? clean.slice(25, 34) : nNFNum.toLocaleString('pt-BR');
    return { serie, nNF };
}

export function parseCceXmlFiles(xmlContents: string[]): CceParsedData | null {
    let eventoBlock = '';
    let retEventoBlock = '';

    for (const rawXml of xmlContents) {
        const ev = extractBlock(rawXml, 'evento');
        if (ev) eventoBlock = ev;

        const ret = extractBlock(rawXml, 'retEvento');
        if (ret) retEventoBlock = ret;
    }

    if (!eventoBlock && !retEventoBlock) {
        return null;
    }

    const cOrgao = extractTagValue(eventoBlock, 'cOrgao') || extractTagValue(retEventoBlock, 'cOrgao') || '35';
    const tpAmb = extractTagValue(eventoBlock, 'tpAmb') || extractTagValue(retEventoBlock, 'tpAmb') || '1';
    const versao =
        extractAttrValue(eventoBlock, 'evento', 'versao') ||
        extractTagValue(eventoBlock, 'verEvento') ||
        extractAttrValue(retEventoBlock, 'retEvento', 'versao') ||
        '1.00';

    const chNFe = extractTagValue(eventoBlock, 'chNFe') || extractTagValue(retEventoBlock, 'chNFe');
    const { serie, nNF } = parseNfeKeyInfo(chNFe);

    const idEvento =
        extractAttrValue(eventoBlock, 'infEvento', 'Id') ||
        extractAttrValue(retEventoBlock, 'infEvento', 'Id') ||
        (chNFe ? `ID110110${chNFe}01` : '');

    const cnpjAutor =
        extractTagValue(eventoBlock, 'CNPJ') ||
        extractTagValue(eventoBlock, 'CPF') ||
        (chNFe.length === 44 ? chNFe.slice(6, 20) : '');

    const cnpjDest = extractTagValue(retEventoBlock, 'CNPJDest') || extractTagValue(retEventoBlock, 'CPFDest');
    const emailDest = extractTagValue(retEventoBlock, 'emailDest');

    const dhEvento = extractTagValue(eventoBlock, 'dhEvento') || extractTagValue(retEventoBlock, 'dhRegEvento');
    const tpEvento = extractTagValue(eventoBlock, 'tpEvento') || extractTagValue(retEventoBlock, 'tpEvento') || '110110';
    const nSeqEvento = extractTagValue(eventoBlock, 'nSeqEvento') || extractTagValue(retEventoBlock, 'nSeqEvento') || '1';
    const verEvento = extractTagValue(eventoBlock, 'verEvento') || versao || '1.00';

    const descEvento = extractTagValue(eventoBlock, 'descEvento') || 'Carta de Correcao';
    const xCorrecao = extractTagValue(eventoBlock, 'xCorrecao');
    const xCondUso = extractTagValue(eventoBlock, 'xCondUso') || CONDICOES_USO_PADRAO;

    const cStat = extractTagValue(retEventoBlock, 'cStat') || (eventoBlock ? '135' : '');
    const xMotivo = extractTagValue(retEventoBlock, 'xMotivo') || 'Evento registrado e vinculado a NF-e';
    const nProt = extractTagValue(retEventoBlock, 'nProt') || 'Não informado (Apenas XML de Pedido)';
    const dhRegEvento = extractTagValue(retEventoBlock, 'dhRegEvento') || dhEvento;
    const verAplic = extractTagValue(retEventoBlock, 'verAplic') || '';

    return {
        cOrgao,
        orgaoLabel: ORGAO_IBGE_MAP[cOrgao] || `${cOrgao} - SEFAZ`,
        tpAmb,
        ambienteLabel: tpAmb === '1' ? '1 - Produção' : '2 - Homologação',
        versao,
        chNFe,
        nNF,
        serie,
        idEvento,
        cnpjAutor: formatCnpjCpf(cnpjAutor),
        cnpjDest: formatCnpjCpf(cnpjDest),
        emailDest,
        dhEvento,
        dhEventoFormatted: formatSefazDateTime(dhEvento),
        tpEvento,
        tipoEventoLabel: tpEvento === '110110' ? '110110 - Carta de Correção' : tpEvento,
        nSeqEvento,
        descEvento,
        verEvento,
        xCorrecao,
        xCondUso,
        cStat,
        xMotivo,
        mensagemAutorizacao: cStat ? `${cStat} - ${xMotivo}` : xMotivo,
        nProt,
        dhRegEvento,
        dhRegEventoFormatted: formatSefazDateTime(dhRegEvento),
        verAplic,
        eventoXmlBlock: eventoBlock,
        retEventoXmlBlock: retEventoBlock,
        hasPed: !!eventoBlock,
        hasRec: !!retEventoBlock,
    };
}

export function generateCceSefazPdf(data: CceParsedData): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); // 297
    const margin = 10;
    const contentW = pageW - margin * 2; // 277
    let y = 12;

    const drawSectionTitle = (title: string) => {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(148, 74, 22); // Marrom SEFAZ (#944A16)
        doc.text(title, pageW / 2, y, { align: 'center' });
        y += 3.5;
    };

    const drawFieldRow = (
        fields: { label: string; value: string; widthRatio: number; minHeight?: number; boldValue?: boolean }[]
    ) => {
        const labelH = 5.2;
        doc.setFontSize(8);
        let maxValH = 6.2;

        // Calculate required height for multiline text
        const splitValues = fields.map((f) => {
            const boxW = contentW * f.widthRatio - 4;
            const lines = doc.splitTextToSize(f.value || '-', boxW);
            const h = Math.max(f.minHeight || 6.2, lines.length * 4 + 2.5);
            if (h > maxValH) maxValH = h;
            return lines;
        });

        const totalRowH = labelH + maxValH + 2;

        // Outer beige block
        doc.setFillColor(243, 234, 216); // #F3EAD8
        doc.setDrawColor(214, 199, 169); // #D6C7A9
        doc.setLineWidth(0.25);
        doc.rect(margin, y, contentW, totalRowH, 'FD');

        let curX = margin;
        fields.forEach((f, idx) => {
            const cellW = contentW * f.widthRatio;

            // Label
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(115, 85, 50); // #735532
            doc.text(f.label, curX + 2, y + 3.8);

            // White value input box inside cell
            const valBoxX = curX + 1.5;
            const valBoxY = y + labelH;
            const valBoxW = cellW - 3;
            const valBoxH = maxValH;

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(218, 206, 182);
            doc.rect(valBoxX, valBoxY, valBoxW, valBoxH, 'FD');

            // Value text
            doc.setFont('helvetica', f.boldValue ? 'bold' : 'normal');
            doc.setFontSize(8.2);
            doc.setTextColor(20, 20, 20);
            doc.text(splitValues[idx], valBoxX + 2, valBoxY + 4.1);

            curX += cellW;
        });

        y += totalRowH + 2.2;
    };

    // Main Header
    drawSectionTitle('Carta de Correção');

    // Subtitle badge with NF number if available
    if (data.nNF) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(
            `Documento Auxiliar da Carta de Correção Eletrônica (CC-e) • NF-e Nº ${data.nNF} (Série ${data.serie || '1'})`,
            pageW / 2,
            y,
            { align: 'center' }
        );
        y += 3;
    }

    // Row 1: Orgão | Ambiente | Versão
    drawFieldRow([
        { label: 'Orgão Recepção do Evento', value: data.orgaoLabel, widthRatio: 0.34 },
        { label: 'Ambiente', value: data.ambienteLabel, widthRatio: 0.33 },
        { label: 'Versão', value: data.versao, widthRatio: 0.33 },
    ]);

    // Row 2: Chave de Acesso | Id do Evento
    drawFieldRow([
        { label: 'Chave de Acesso', value: data.chNFe, widthRatio: 0.5, boldValue: true },
        { label: 'Id do Evento', value: data.idEvento, widthRatio: 0.5 },
    ]);

    // Row 3: Autor Evento | Data Evento (and Destinatário if present)
    drawFieldRow([
        { label: 'Autor Evento (CNPJ / CPF)', value: data.cnpjAutor, widthRatio: 0.5 },
        { label: 'Data Evento', value: data.dhEventoFormatted, widthRatio: 0.5 },
    ]);

    // Row 4: Tipo de Evento | Sequencial do Evento
    drawFieldRow([
        { label: 'Tipo de Evento', value: data.tipoEventoLabel, widthRatio: 0.5 },
        { label: 'Sequencial do Evento', value: data.nSeqEvento, widthRatio: 0.5 },
    ]);

    // Section: Detalhes do Evento
    drawSectionTitle('Detalhes do Evento');

    // Row 5: Descrição do Evento | Versão
    drawFieldRow([
        { label: 'Descrição do Evento', value: data.descEvento, widthRatio: 0.5 },
        { label: 'Versão', value: data.verEvento, widthRatio: 0.5 },
    ]);

    // Row 6: Texto da Carta de Correção
    drawFieldRow([
        {
            label: 'Texto da Carta de Correção',
            value: data.xCorrecao || '(Sem texto de correção no XML informado)',
            widthRatio: 1.0,
            minHeight: 10,
            boldValue: true,
        },
    ]);

    // Section: Autorização pela SEFAZ
    drawSectionTitle('Autorização pela SEFAZ');

    // Row 7: Mensagem de Autorização | Protocolo | Data/Hora Autorização
    drawFieldRow([
        { label: 'Mensagem de Autorização', value: data.mensagemAutorizacao, widthRatio: 0.45, boldValue: true },
        { label: 'Protocolo', value: data.nProt, widthRatio: 0.25, boldValue: true },
        { label: 'Data/Hora Autorização', value: data.dhRegEventoFormatted, widthRatio: 0.3 },
    ]);

    // Section: Condições de uso da Carta de Correção
    drawSectionTitle('Condições de uso da Carta de Correção');

    drawFieldRow([
        {
            label: 'Texto Legal (Art. 7º do Convênio S/N de 15/12/1970)',
            value: data.xCondUso,
            widthRatio: 1.0,
            minHeight: 12,
        },
    ]);

    return doc;
}

export default function CcePdfGenerator() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filesLoaded, setFilesLoaded] = useState<string[]>([]);
    const [rawXmls, setRawXmls] = useState<string[]>([]);
    const [cceData, setCceData] = useState<CceParsedData | null>(null);

    const handleFilesSelected = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const newNames: string[] = [...filesLoaded];
        const newXmls: string[] = [...rawXmls];

        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            const text = await f.text();
            newNames.push(f.name);
            newXmls.push(text);
        }

        const parsed = parseCceXmlFiles(newXmls);
        if (!parsed) {
            toast({
                title: 'XML inválido para CC-e',
                description: 'Envie o arquivo de pedido (*-cce-ped.xml), retorno (*-cce-rec.xml) ou procEventoNFe.xml.',
                variant: 'destructive',
            });
            return;
        }

        setFilesLoaded(newNames);
        setRawXmls(newXmls);
        setCceData(parsed);

        toast({
            title: 'XML(s) de Carta de Correção carregados!',
            description: parsed.hasPed && parsed.hasRec
                ? 'Pedido e Retorno SEFAZ vinculados com sucesso!'
                : parsed.hasPed
                  ? 'XML de Pedido carregado. Você pode adicionar o XML de Retorno (*-rec.xml) para incluir o Protocolo.'
                  : 'XML de Retorno carregado. Adicione o XML de Pedido (*-ped.xml) para incluir o Texto da Correção.',
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClear = () => {
        setFilesLoaded([]);
        setRawXmls([]);
        setCceData(null);
    };

    const handleDownloadPdf = () => {
        if (!cceData) return;
        const doc = generateCceSefazPdf(cceData);
        const nfPart = cceData.nNF ? `NFe-${cceData.nNF.replace(/\D/g, '')}` : cceData.chNFe.slice(0, 12);
        doc.save(`Carta-de-Correcao-${nfPart}-Seq${cceData.nSeqEvento}.pdf`);
        toast({
            title: 'PDF Gerado!',
            description: 'O PDF da Carta de Correção foi baixado com sucesso.',
        });
    };

    const handlePreviewPdf = () => {
        if (!cceData) return;
        const doc = generateCceSefazPdf(cceData);
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
    };

    const handleDownloadUnifiedXml = () => {
        if (!cceData || !cceData.eventoXmlBlock || !cceData.retEventoXmlBlock) {
            toast({
                title: 'Arquivos incompletos',
                description: 'Para gerar o procEventoNFe unificado, carregue tanto o XML de pedido (-ped) quanto o de retorno (-rec).',
                variant: 'destructive',
            });
            return;
        }

        const unified = `<?xml version="1.0" encoding="utf-8"?><procEventoNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">${cceData.eventoXmlBlock}${cceData.retEventoXmlBlock}</procEventoNFe>`;
        const blob = new Blob([unified], { type: 'text/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `procEventoNFe-${cceData.chNFe}-seq${cceData.nSeqEvento}.xml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* Upload Bar */}
            <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Gerador de PDF de Carta de Correção (CC-e SEFAZ)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Selecione os dois arquivos XML da CC-e (<b>*-cce-ped.xml</b> e <b>*-cce-rec.xml</b>) juntos ou o <b>procEventoNFe.xml</b>.
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xml"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files)}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="default"
                                size="sm"
                                className="gap-1.5 font-bold"
                            >
                                <Upload className="h-4 w-4" />
                                {cceData ? 'Adicionar / Trocar XML(s)' : 'Selecionar XML(s) da CC-e'}
                            </Button>

                            {cceData && (
                                <>
                                    <Button
                                        onClick={handlePreviewPdf}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 font-bold"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Visualizar / Imprimir PDF
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPdf}
                                        variant="default"
                                        size="sm"
                                        className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Download className="h-4 w-4" />
                                        Baixar PDF (Modelo SEFAZ)
                                    </Button>
                                    {cceData.hasPed && cceData.hasRec && (
                                        <Button
                                            onClick={handleDownloadUnifiedXml}
                                            variant="secondary"
                                            size="sm"
                                            className="gap-1.5 font-semibold text-xs"
                                            title="Une o -ped.xml e -rec.xml em um único procEventoNFe.xml padrão"
                                        >
                                            <FileCode2 className="h-3.5 w-3.5" />
                                            Baixar XML Unificado
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleClear}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        title="Limpar arquivos"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {filesLoaded.length > 0 && (
                    <CardContent className="pt-0 pb-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-semibold">Arquivos carregados:</span>
                            {filesLoaded.map((name, i) => (
                                <Badge key={i} variant="secondary" className="gap-1 font-mono text-[11px]">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    {name}
                                </Badge>
                            ))}
                            {cceData && (
                                <Badge variant={cceData.hasPed && cceData.hasRec ? 'default' : 'outline'} className="text-[11px]">
                                    {cceData.hasPed && cceData.hasRec
                                        ? 'Completo (Pedido + Autorização SEFAZ)'
                                        : cceData.hasPed
                                          ? 'Falta XML de Retorno (*-rec.xml)'
                                          : 'Falta XML de Pedido (*-ped.xml)'}
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Dropzone Empty State */}
            {!cceData && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleFilesSelected(e.dataTransfer.files);
                    }}
                    className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-card/50 hover:bg-muted/20"
                >
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-black text-foreground">
                        Arraste os arquivos XML da Carta de Correção aqui ou clique para selecionar
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        Você pode selecionar os 2 arquivos juntos (ex: <code>928-cce-ped.xml</code> e <code>928-cce-rec.xml</code>) para gerar o espelho idêntico ao site da SEFAZ em PDF.
                    </p>
                </div>
            )}

            {/* SEFAZ Fidelity Preview */}
            {cceData && (
                <div className="rounded-xl border border-[#D6C7A9] bg-white p-5 shadow-md space-y-3 text-black">
                    <div className="text-center space-y-0.5">
                        <h2 className="text-base font-bold text-[#944A16]">Carta de Correção</h2>
                        {cceData.nNF && (
                            <p className="text-xs text-neutral-600 font-medium">
                                NF-e Nº <span className="font-bold text-neutral-900">{cceData.nNF}</span> • Série {cceData.serie || '1'}
                            </p>
                        )}
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded">
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Orgão Recepção do Evento</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.orgaoLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Ambiente</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.ambienteLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Versão</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.versao}
                            </div>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded">
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Chave de Acesso</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-bold font-mono text-neutral-900 break-all">
                                {cceData.chNFe}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Id do Evento</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-mono text-neutral-900 break-all">
                                {cceData.idEvento}
                            </div>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded">
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Autor Evento (CNPJ / CPF)</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.cnpjAutor}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Data Evento</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.dhEventoFormatted}
                            </div>
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded">
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Tipo de Evento</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.tipoEventoLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#735532] mb-0.5">Sequencial do Evento</div>
                            <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                {cceData.nSeqEvento}
                            </div>
                        </div>
                    </div>

                    {/* Section: Detalhes do Evento */}
                    <div className="pt-1">
                        <h3 className="text-sm font-bold text-[#944A16] mb-1.5">Detalhes do Evento</h3>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded">
                                <div>
                                    <div className="text-[11px] font-bold text-[#735532] mb-0.5">Descrição do Evento</div>
                                    <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                        {cceData.descEvento}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-[#735532] mb-0.5">Versão</div>
                                    <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                        {cceData.verEvento}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded">
                                <div className="text-[11px] font-bold text-[#735532] mb-0.5">Texto da Carta de Correção</div>
                                <div className="bg-white border border-[#DACEB6] px-2.5 py-2 text-xs font-bold text-neutral-900 whitespace-pre-wrap">
                                    {cceData.xCorrecao || '(Sem texto de correção - carregue o arquivo *-ped.xml)'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Autorização pela SEFAZ */}
                    <div className="pt-1 text-center">
                        <h3 className="text-sm font-bold text-[#944A16] mb-1.5">Autorização pela SEFAZ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded text-left">
                            <div>
                                <div className="text-[11px] font-bold text-[#735532] mb-0.5">Mensagem de Autorização</div>
                                <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-bold text-neutral-900">
                                    {cceData.mensagemAutorizacao}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-[#735532] mb-0.5">Protocolo</div>
                                <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-bold font-mono text-neutral-900">
                                    {cceData.nProt}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-[#735532] mb-0.5">Data/Hora Autorização</div>
                                <div className="bg-white border border-[#DACEB6] px-2 py-1 text-xs font-medium text-neutral-900">
                                    {cceData.dhRegEventoFormatted}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Condições de uso */}
                    <div className="pt-1 text-center">
                        <h3 className="text-sm font-bold text-[#944A16] mb-1.5">Condições de uso da Carta de Correção</h3>
                        <div className="bg-[#F3EAD8] border border-[#D6C7A9] p-2 rounded text-left">
                            <div className="bg-white border border-[#DACEB6] px-2.5 py-2 text-[11px] leading-relaxed text-neutral-800">
                                {cceData.xCondUso}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

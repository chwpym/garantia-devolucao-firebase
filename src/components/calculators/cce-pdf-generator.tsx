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
    RectangleVertical,
    RectangleHorizontal
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

export type CcePdfOrientation = 'portrait' | 'landscape';

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

interface FieldSpec {
    label?: string;
    value: string;
    widthRatio: number;
    minHeight?: number;
}

export function generateCceSefazPdf(
    data: CceParsedData,
    orientation: CcePdfOrientation = 'portrait'
): jsPDF {
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const isPortrait = orientation === 'portrait';
    const margin = isPortrait ? 12 : 10;
    const contentW = pageW - margin * 2;
    let y = isPortrait ? 18 : 12;

    const valueFontSize = isPortrait ? 7.1 : 8.2;
    const labelFontSize = isPortrait ? 6.8 : 7.5;

    const drawSectionTitle = (title: string, align: 'center' | 'left' = 'center') => {
        y += 3.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isPortrait ? 9.5 : 10.5);
        doc.setTextColor(153, 84, 30); // #99541E (Marrom SEFAZ)
        if (align === 'left') {
            doc.text(title, margin, y);
        } else {
            doc.text(title, pageW / 2, y, { align: 'center' });
        }
        y += 3.2;
    };

    // Allows drawing 1 or multiple rows inside a single beige SEFAZ container box
    const drawBeigeContainer = (rows: FieldSpec[][]) => {
        const rowMetrics = rows.map((fields) => {
            const hasLabels = fields.some((f) => !!f.label);
            const labelH = hasLabels ? 4.8 : 1.5;
            let maxValH = 5.6;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(valueFontSize);

            const splitValues = fields.map((f) => {
                const boxW = contentW * f.widthRatio - 4;
                const lines = doc.splitTextToSize(f.value || '-', boxW);
                const h = Math.max(f.minHeight || 5.6, lines.length * 3.6 + 2.2);
                if (h > maxValH) maxValH = h;
                return lines;
            });

            return {
                fields,
                hasLabels,
                labelH,
                maxValH,
                splitValues,
                rowH: labelH + maxValH + 1.6,
            };
        });

        const totalContainerH = rowMetrics.reduce((acc, r) => acc + r.rowH, 0) + 0.6;

        // Outer beige block (#F5EFE2 border #C9B28B)
        doc.setFillColor(245, 239, 226);
        doc.setDrawColor(201, 178, 139);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentW, totalContainerH, 'FD');

        let curY = y;
        rowMetrics.forEach((rm) => {
            let curX = margin;
            rm.fields.forEach((f, idx) => {
                const cellW = contentW * f.widthRatio;

                if (rm.hasLabels && f.label) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(labelFontSize);
                    doc.setTextColor(122, 82, 48); // #7A5230
                    doc.text(f.label, curX + 2, curY + 3.5);
                }

                const valBoxX = curX + 1.5;
                const valBoxY = curY + rm.labelH;
                const valBoxW = cellW - 3;
                const valBoxH = rm.maxValH;

                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(214, 198, 170);
                doc.setLineWidth(0.2);
                doc.rect(valBoxX, valBoxY, valBoxW, valBoxH, 'FD');

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(valueFontSize);
                doc.setTextColor(15, 15, 15);
                doc.text(rm.splitValues[idx], valBoxX + 1.8, valBoxY + 3.8);

                curX += cellW;
            });
            curY += rm.rowH;
        });

        y += totalContainerH + 2.8;
    };

    // Main Title
    drawSectionTitle('Carta de Correção', 'center');

    // Box 1: Orgão | Ambiente | Versão
    drawBeigeContainer([
        [
            { label: 'Orgão Recepção do Evento', value: data.orgaoLabel, widthRatio: 0.35 },
            { label: 'Ambiente', value: data.ambienteLabel, widthRatio: 0.35 },
            { label: 'Versão', value: data.versao, widthRatio: 0.3 },
        ],
    ]);

    // Box 2 (2 rows inside the same beige container, identical to SEFAZ print):
    // Row 1: Chave de Acesso | Id do Evento
    // Row 2: Autor Evento (CNPJ / CPF) | Data Evento
    drawBeigeContainer([
        [
            { label: 'Chave de Acesso', value: data.chNFe, widthRatio: 0.48 },
            { label: 'Id do Evento', value: data.idEvento, widthRatio: 0.52 },
        ],
        [
            { label: 'Autor Evento (CNPJ / CPF)', value: data.cnpjAutor, widthRatio: 0.48 },
            { label: 'Data Evento', value: data.dhEventoFormatted, widthRatio: 0.52 },
        ],
    ]);

    // Box 3: Tipo de Evento | Sequencial do Evento
    drawBeigeContainer([
        [
            { label: 'Tipo de Evento', value: data.tipoEventoLabel, widthRatio: 0.48 },
            { label: 'Sequencial do Evento', value: data.nSeqEvento, widthRatio: 0.52 },
        ],
    ]);

    // Section: Detalhes do Evento (Left aligned like SEFAZ)
    drawSectionTitle('Detalhes do Evento', 'left');

    // Box 4: Descrição do Evento | Versão
    drawBeigeContainer([
        [
            { label: 'Descrição do Evento', value: data.descEvento, widthRatio: 0.48 },
            { label: 'Versão', value: data.verEvento, widthRatio: 0.52 },
        ],
    ]);

    // Box 5: Texto da Carta de Correção
    drawBeigeContainer([
        [
            {
                label: 'Texto da Carta de Correção',
                value: data.xCorrecao || '(Sem texto de correção no XML informado)',
                widthRatio: 1.0,
            },
        ],
    ]);

    // Section: Autorização pela SEFAZ (Centered)
    drawSectionTitle('Autorização pela SEFAZ', 'center');

    // Box 6: Mensagem de Autorização | Protocolo | Data/Hora Autorização
    drawBeigeContainer([
        [
            { label: 'Mensagem de Autorização', value: data.mensagemAutorizacao, widthRatio: 0.46 },
            { label: 'Protocolo', value: data.nProt, widthRatio: 0.22 },
            { label: 'Data/Hora Autorização', value: data.dhRegEventoFormatted, widthRatio: 0.32 },
        ],
    ]);

    // Section: Condições de uso da Carta de Correção (Centered)
    drawSectionTitle('Condições de uso da Carta de Correção', 'center');

    // Box 7: No label, directly white box inside beige frame (identical to SEFAZ)
    drawBeigeContainer([
        [
            {
                value: data.xCondUso,
                widthRatio: 1.0,
                minHeight: 13,
            },
        ],
    ]);

    return doc;
}

export default function CcePdfGenerator() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filesLoaded, setFilesLoaded] = useState<string[]>([]);
    const [rawXmls, setRawXmls] = useState<string[]>([]);
    const [cceData, setCceData] = useState<CceParsedData | null>(null);
    const [orientation, setOrientation] = useState<CcePdfOrientation>('portrait');

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
        const doc = generateCceSefazPdf(cceData, orientation);
        const nfPart = cceData.nNF ? `NFe-${cceData.nNF.replace(/\D/g, '')}` : cceData.chNFe.slice(0, 12);
        doc.save(`Carta-de-Correcao-${nfPart}-Seq${cceData.nSeqEvento}.pdf`);
        toast({
            title: 'PDF Gerado!',
            description: `O PDF da Carta de Correção (${orientation === 'portrait' ? 'Retrato' : 'Paisagem'}) foi baixado.`,
        });
    };

    const handlePreviewPdf = () => {
        if (!cceData) return;
        const doc = generateCceSefazPdf(cceData, orientation);
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
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                            {/* Orientation selector (Portrait default) */}
                            <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border">
                                <Button
                                    type="button"
                                    variant={orientation === 'portrait' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setOrientation('portrait')}
                                    className="h-7 px-2.5 text-xs gap-1 font-bold"
                                    title="Formato A4 Retrato (Em pé - Igual à impressão do site da SEFAZ)"
                                >
                                    <RectangleVertical className="h-3.5 w-3.5" />
                                    Retrato (Padrão)
                                </Button>
                                <Button
                                    type="button"
                                    variant={orientation === 'landscape' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setOrientation('landscape')}
                                    className="h-7 px-2.5 text-xs gap-1 font-bold"
                                    title="Formato A4 Paisagem (Deitado)"
                                >
                                    <RectangleHorizontal className="h-3.5 w-3.5" />
                                    Paisagem
                                </Button>
                            </div>

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
                                        Baixar PDF
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
                                            XML Unificado
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
                        Você pode selecionar os 2 arquivos juntos (ex: <code>928-cce-ped.xml</code> e <code>928-cce-rec.xml</code>) para gerar o espelho idêntico ao site da SEFAZ em PDF (Retrato ou Paisagem).
                    </p>
                </div>
            )}

            {/* SEFAZ Fidelity Preview */}
            {cceData && (
                <div
                    className={
                        orientation === 'portrait'
                            ? 'mx-auto max-w-[794px] rounded-xl border border-[#C9B28B] bg-white p-6 shadow-md space-y-3 text-black'
                            : 'rounded-xl border border-[#C9B28B] bg-white p-5 shadow-md space-y-3 text-black'
                    }
                >
                    <div className="text-center">
                        <h2 className="text-base font-bold text-[#99541E]">Carta de Correção</h2>
                    </div>

                    {/* Box 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#F5EFE2] border border-[#C9B28B] p-2">
                        <div>
                            <div className="text-[11px] text-[#7A5230] mb-0.5">Orgão Recepção do Evento</div>
                            <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                {cceData.orgaoLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-[#7A5230] mb-0.5">Ambiente</div>
                            <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                {cceData.ambienteLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-[#7A5230] mb-0.5">Versão</div>
                            <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                {cceData.versao}
                            </div>
                        </div>
                    </div>

                    {/* Box 2 (2 rows combined inside the same beige box, just like SEFAZ) */}
                    <div className="bg-[#F5EFE2] border border-[#C9B28B] p-2 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Chave de Acesso</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs font-mono text-neutral-900 break-all">
                                    {cceData.chNFe}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Id do Evento</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs font-mono text-neutral-900 break-all">
                                    {cceData.idEvento}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Autor Evento (CNPJ / CPF)</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                    {cceData.cnpjAutor}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Data Evento</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                    {cceData.dhEventoFormatted}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Box 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#F5EFE2] border border-[#C9B28B] p-2">
                        <div>
                            <div className="text-[11px] text-[#7A5230] mb-0.5">Tipo de Evento</div>
                            <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                {cceData.tipoEventoLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-[#7A5230] mb-0.5">Sequencial do Evento</div>
                            <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                {cceData.nSeqEvento}
                            </div>
                        </div>
                    </div>

                    {/* Section: Detalhes do Evento */}
                    <div className="pt-1">
                        <h3 className="text-sm font-bold text-[#99541E] mb-1.5 text-left">Detalhes do Evento</h3>
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#F5EFE2] border border-[#C9B28B] p-2">
                                <div>
                                    <div className="text-[11px] text-[#7A5230] mb-0.5">Descrição do Evento</div>
                                    <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                        {cceData.descEvento}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-[#7A5230] mb-0.5">Versão</div>
                                    <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                        {cceData.verEvento}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#F5EFE2] border border-[#C9B28B] p-2">
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Texto da Carta de Correção</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1.5 text-xs text-neutral-900 whitespace-pre-wrap">
                                    {cceData.xCorrecao || '(Sem texto de correção - carregue o arquivo *-ped.xml)'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Autorização pela SEFAZ */}
                    <div className="pt-1 text-center">
                        <h3 className="text-sm font-bold text-[#99541E] mb-1.5">Autorização pela SEFAZ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#F5EFE2] border border-[#C9B28B] p-2 text-left">
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Mensagem de Autorização</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                    {cceData.mensagemAutorizacao}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Protocolo</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs font-mono text-neutral-900">
                                    {cceData.nProt}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] text-[#7A5230] mb-0.5">Data/Hora Autorização</div>
                                <div className="bg-white border border-[#D6C6AA] px-2 py-1 text-xs text-neutral-900">
                                    {cceData.dhRegEventoFormatted}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Condições de uso */}
                    <div className="pt-1 text-center">
                        <h3 className="text-sm font-bold text-[#99541E] mb-1.5">Condições de uso da Carta de Correção</h3>
                        <div className="bg-[#F5EFE2] border border-[#C9B28B] p-2 text-left">
                            <div className="bg-white border border-[#D6C6AA] px-2.5 py-2 text-[11px] leading-snug text-neutral-900">
                                {cceData.xCondUso}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useRef } from "react";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Info, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const ORIGEM_LEGENDA: Record<string, string> = {
    "0": "Nacional (Exceto as indicadas nos códigos 3, 4, 5 e 8)",
    "1": "Estrangeira - Importação direta (Exceto a do código 6)",
    "2": "Estrangeira - Adquirida no mercado interno (Exceto a do 7)",
    "3": "Nacional - Conteúdo de Importação superior a 40%",
    "4": "Nacional - Produção Processos Produtivos Básicos (PPB)",
    "5": "Nacional - Conteúdo de Importação inferior/igual a 40%",
    "6": "Estrangeira - Importação direta, sem similar nacional (CAMEX)",
    "7": "Estrangeira - Adquirida mercado interno, sem similar (CAMEX)",
    "8": "Nacional - Conteúdo de Importação superior a 70%"
};

interface ProductItem {
    id: number;
    description: string;
    ncm: string;
    orig: string;
    cst: string;
    cfop: string;
}

export default function NfeProductOriginCalculator() {
    const [items, setItems] = useState<ProductItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportXml = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlData = e.target?.result as string;
                const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
                const jsonObj = parser.parse(xmlData);

                const infNFe = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
                if (!infNFe) {
                    throw new Error("Estrutura do XML inválida ou <infNFe> não encontrado.");
                }

                const dets = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
                if (!dets || dets.length === 0) {
                    throw new Error("Nenhum produto (tag <det>) localizado no XML.");
                }

                const parsedItems: ProductItem[] = dets.map((det: any, index: number) => {
                    const prod = det.prod || {};
                    const imposto = det.imposto || {};

                    let orig = "N/A";
                    let cst = "N/A";

                    if (imposto.ICMS) {
                        const icmsGroup = imposto.ICMS;
                        const icmsKey = Object.keys(icmsGroup)[0];
                        if (icmsKey) {
                            const icmsContent = icmsGroup[icmsKey];
                            orig = icmsContent.orig !== undefined ? String(icmsContent.orig) : "N/A";
                            cst = icmsContent.CST || icmsContent.CSOSN || "N/A";
                        }
                    }

                    return {
                        id: index + 1,
                        description: prod.xProd || "N/A",
                        ncm: prod.NCM || "N/A",
                        orig: orig,
                        cst: cst,
                        cfop: prod.CFOP || "N/A"
                    };
                });

                setItems(parsedItems);
                toast({
                    title: "Sucesso!",
                    description: `${parsedItems.length} produtos importados e analisados.`,
                });

            } catch (error: any) {
                console.error("Erro no processamento:", error);
                setItems([]);
                setFileName(null);
                toast({
                    variant: "destructive",
                    title: "Erro de Importação",
                    description: error.message || "Não foi possível ler o arquivo XML.",
                });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file, 'ISO-8859-1');
    };

    const clearData = () => {
        setItems([]);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center">
                <Button onClick={() => fileInputRef.current?.click()} className="bg-orange-500 hover:bg-orange-600">
                    <Upload className="mr-2 h-4 w-4" />
                    Importar XML da NF-e
                </Button>
                {fileName && (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted flex-1 sm:flex-none justify-between">
                        <span className="text-sm text-muted-foreground truncate" title={fileName}>{fileName}</span>
                        <Button variant="ghost" size="icon" onClick={clearData} className="h-6 w-6">
                            <FileX className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
                <Input type="file" ref={fileInputRef} onChange={handleImportXml} className="hidden" accept=".xml" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Painel de Legenda lateral */}
                <Card className="md:col-span-1 h-fit border border-orange-200/50 bg-orange-500/5 backdrop-blur-sm">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-orange-600">
                            <Info className="h-4 w-4" /> Origem da Mercadoria
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Legenda do dígito de Origem (Tabela A do ICMS)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        {Object.entries(ORIGEM_LEGENDA).map(([key, label]) => (
                            <div key={key} className="flex items-start gap-2 border-b border-orange-200/20 pb-1.5 last:border-0">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-orange-500/10 text-orange-600 font-bold text-xs shrink-0">
                                    {key}
                                </span>
                                <span className="text-xs text-muted-foreground leading-tight">{label}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Tabela de Produtos */}
                <Card className="md:col-span-3">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-primary" /> Produtos do XML
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[55vh] rounded-md border-t">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                                    <TableRow>
                                        <TableHead className="w-12 text-center">Item</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="w-24">NCM</TableHead>
                                        <TableHead className="w-16 text-center">Origem</TableHead>
                                        <TableHead className="w-20 text-center">CST/CSOSN</TableHead>
                                        <TableHead className="w-16">CFOP</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/30">
                                            <TableCell className="text-center font-mono text-xs">{item.id}</TableCell>
                                            <TableCell className="font-medium text-xs">{item.description}</TableCell>
                                            <TableCell className="font-mono text-xs text-primary">{item.ncm}</TableCell>
                                            <TableCell className="text-center">
                                                <span 
                                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-500/10 text-orange-600 font-bold text-xs" 
                                                    title={ORIGEM_LEGENDA[item.orig] || "Não Identificado"}
                                                >
                                                    {item.orig}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs">{item.cst}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.cfop}</TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-[40vh] text-center text-muted-foreground italic">
                                                Importe um arquivo XML para visualizar as origens dos produtos.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Info, Printer, Upload, ChevronsRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { useNfeParser, type NfeData, type NfeProductDetail } from "@/hooks/use-nfe-parser";


interface BatchPriceItem {
    id: number;
    description: string;
    quantity: string;
    fatorConversao?: string; // Fator de Conversão
    originalCost: string;
    impostos: string; // IPI + ICMS-ST + Frete + Seguro + Outras
    desconto: string;
    finalCost: string; // Custo Final Líquido
    margin: string;
    impostoSobreVenda?: string; // Imposto sobre Venda (%)
    price: string;
}

export default function BatchPricingCalculator() {
    const [items, setItems] = useState<BatchPriceItem[]>([
        { id: 1, description: "", quantity: "1", fatorConversao: "1", originalCost: "", impostos: "", desconto: "", finalCost: "", margin: "", impostoSobreVenda: "", price: "" },
    ]);
    const [globalMargin, setGlobalMargin] = useState("");
    const [nfeInfo, setNfeInfo] = useState<{ emitterName: string; emitterCnpj: string; nfeNumber: string; } | null>(null);
    const { toast } = useToast();

    const onNfeProcessed = (data: NfeData | null) => {
        if (!data) {
            setItems([{ id: 1, description: "", quantity: "1", fatorConversao: "1", originalCost: "", impostos: "", desconto: "", finalCost: "", margin: "", impostoSobreVenda: "", price: "" }]);
            setNfeInfo(null);
            return;
        }

        const { infNFe, det: dets } = data;
        setNfeInfo({
            emitterName: infNFe.emit.xNome,
            emitterCnpj: infNFe.emit.CNPJ,
            nfeNumber: infNFe.ide.nNF,
        });
        
        const total = infNFe.total.ICMSTot;

        const totalProdValue = parseFloat(total.vProd) || 0;
        const totalFrete = parseFloat(total.vFrete) || 0;
        const totalSeguro = parseFloat(total.vSeg) || 0;
        const totalOutras = parseFloat(total.vOutro) || 0;

        const newItems: BatchPriceItem[] = dets.map((det: NfeProductDetail, index: number) => {
            const prod = det.prod;
            const imposto = det.imposto;

            const quantity = parseFloat(prod.qCom) || 0;
            const originalUnitCost = parseFloat(prod.vUnCom) || 0;
            const itemTotalCost = parseFloat(prod.vProd) || 0;

            const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

            const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI) || 0;
            const stValor = parseFloat(imposto?.ICMS?.ICMSST?.vICMSST) || 0;

            const freteRateado = parseFloat(prod.vFrete) || (totalFrete * itemWeight) || 0;
            const seguroRateado = parseFloat(prod.vSeg) || (totalSeguro * itemWeight) || 0;
            const descontoTotal = parseFloat(prod.vDesc) || 0;
            const outrasRateado = parseFloat(prod.vOutro) || (totalOutras * itemWeight) || 0;

            const totalImpostosItem = ipiValor + stValor + freteRateado + seguroRateado + outrasRateado;
            const finalTotalCost = itemTotalCost + totalImpostosItem - descontoTotal;
            const finalUnitCost = quantity > 0 ? finalTotalCost / quantity : 0;
            const impostosUnit = quantity > 0 ? totalImpostosItem / quantity : 0;
            const descontoUnit = quantity > 0 ? descontoTotal / quantity : 0;

            return {
                id: index,
                description: prod.xProd || "",
                quantity: String(quantity),
                fatorConversao: "1",
                originalCost: originalUnitCost.toString(),
                impostos: impostosUnit.toString(),
                desconto: descontoUnit.toString(),
                finalCost: finalUnitCost.toString(),
                margin: "",
                impostoSobreVenda: "",
                price: ""
            };
        });
        
        setItems(newItems.length > 0 ? newItems : [{ id: 1, description: "", quantity: "1", fatorConversao: "1", originalCost: "", impostos: "", desconto: "", finalCost: "", margin: "", impostoSobreVenda: "", price: "" }]);

        toast({
            title: "Sucesso!",
            description: `${newItems.length} itens importados da NF-e.`,
        });
    };

    const { handleFileChange, fileInputRef } = useNfeParser({ onNfeProcessed });


    const handleItemChange = (id: number, field: keyof BatchPriceItem, value: string) => {
        setItems(prevItems => {
            const newItems = prevItems.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };

                    const finalCost = parseFloat(updatedItem.finalCost) || 0;
                    const fator = parseFloat(updatedItem.fatorConversao || "1") || 1;
                    const impostoSale = parseFloat(updatedItem.impostoSobreVenda || "0") || 0;
                    let margin = parseFloat(updatedItem.margin) || 0;
                    let price = parseFloat(updatedItem.price) || 0;

                    const costPerSaleUnit = finalCost / fator;

                    if (costPerSaleUnit > 0) {
                        if (field === 'margin' || field === 'finalCost' || field === 'fatorConversao' || field === 'impostoSobreVenda') {
                            // Preço = Custo * (1 + Margem/100) / (1 - ImpostoVenda/100)
                            const marginFactor = 1 + margin / 100;
                            const taxFactor = 1 - impostoSale / 100;
                            
                            if (taxFactor > 0) {
                                price = (costPerSaleUnit * marginFactor) / taxFactor;
                            } else {
                                price = costPerSaleUnit * marginFactor; // Fallback
                            }
                            updatedItem.price = price.toFixed(4);
                        } else if (field === 'price') {
                            margin = costPerSaleUnit > 0 
                                ? (((price * (1 - impostoSale / 100)) - costPerSaleUnit) / costPerSaleUnit) * 100 
                                : 0;
                            updatedItem.margin = margin.toFixed(2);
                        }
                    } else {
                        updatedItem.price = "";
                        updatedItem.margin = "";
                    }

                    return updatedItem;
                }
                return item;
            });
            return newItems; // ERA PREVITEMS (Conserta o travamento do campo)
        });
    };

    const applyGlobalMargin = () => {
        const marginValue = parseFloat(globalMargin);
        if (isNaN(marginValue)) {
            toast({
                variant: "destructive",
                title: "Margem Inválida",
                description: "Por favor, insira um número válido para a margem.",
            });
            return;
        }

        setItems(prevItems => {
            return prevItems.map(item => {
                const finalCost = parseFloat(item.finalCost) || 0;
                const fator = parseFloat(item.fatorConversao || "1") || 1;
                const impostoSale = parseFloat(item.impostoSobreVenda || "0") || 0;
                const costPerSaleUnit = finalCost / fator;

                if (costPerSaleUnit > 0) {
                    const marginFactor = 1 + marginValue / 100;
                    const taxFactor = 1 - impostoSale / 100;
                    const price = taxFactor > 0 ? (costPerSaleUnit * marginFactor) / taxFactor : (costPerSaleUnit * marginFactor);

                    return {
                        ...item,
                        margin: globalMargin,
                        price: price.toFixed(4),
                    };
                }
                return item;
            });
        });

        toast({
            title: "Sucesso!",
            description: `Margem de ${formatNumber(marginValue)}% aplicada a todos os itens.`,
        });
    };

    const addItem = () => {
        setItems(prev => [
            ...prev,
            { id: prev.length, description: "", quantity: "1", originalCost: "", impostos: "", desconto: "", finalCost: "", margin: "", price: "" },
        ]);
    };

    const removeItem = (id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const totals = useMemo(() => {
        const totalFinalCost = items.reduce((acc, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const cost = parseFloat(item.finalCost) || 0;
            return acc + (quantity * cost);
        }, 0);

        const totalSaleValue = items.reduce((acc, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const fator = parseFloat(item.fatorConversao || "1") || 1;
            const price = parseFloat(item.price) || 0;
            return acc + (quantity * fator * price);
        }, 0);

        const averageMargin = totalFinalCost > 0 ? ((totalSaleValue - totalFinalCost) / totalFinalCost) * 100 : 0;

        return { totalFinalCost, totalSaleValue, averageMargin };
    }, [items]);


    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(18);
        doc.text("Precificação de Lote", 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [['Descrição', 'Qtde', 'Fator', 'C. Orig. Un.', 'Impostos Imp.', 'Desc. Un.', 'C. Final Un.', 'Margem (%)', 'Imp. Venda (%)', 'Venda Un.', 'Venda Total']],
            body: items.map(item => {
                const quantity = parseFloat(item.quantity) || 0;
                const fator = parseFloat(item.fatorConversao || "1") || 1;
                const price = parseFloat(item.price) || 0;
                const totalSale = quantity * fator * price;
                return [
                    item.description,
                    formatNumber4(quantity),
                    formatNumber4(fator),
                    formatCurrency4(parseFloat(item.originalCost) || 0),
                    formatCurrency4(parseFloat(item.impostos) || 0),
                    formatCurrency4(parseFloat(item.desconto) || 0),
                    formatCurrency4(parseFloat(item.finalCost) || 0),
                    `${formatNumber(parseFloat(item.margin) || 0)}%`,
                    `${formatNumber(parseFloat(item.impostoSobreVenda || "0") || 0)}%`,
                    formatCurrency4(price),
                    formatCurrency(totalSale)
                ];
            }),
            foot: [
                [
                    { content: 'Totais:', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: 'Média:', styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: `${formatNumber(totals.averageMargin)}%`, styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalSaleValue), styles: { fontStyle: 'bold' } },
                ]
            ],
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0, 0, 0], fontStyle: 'bold' },
        });

        doc.save("precificacao_lote.pdf");
    };

    return (
        <div className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center bg-muted/20 p-4 rounded-lg border">
                <div className="flex gap-2 mr-auto">
                    <Button onClick={generatePdf} size="sm" disabled={items.length === 0 || (items.length === 1 && !items[0].description)} className="bg-primary/90 hover:bg-primary">
                        <Printer className="mr-2 h-3.5 w-3.5" />
                        Gerar PDF
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="secondary">
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        Importar XML
                    </Button>
                </div>

                <div className="flex items-center gap-2 bg-background/50 p-1.5 px-3 rounded-md border text-sm">
                    <Label htmlFor="global-margin" className="whitespace-nowrap font-medium text-xs">Margem Global (%):</Label>
                    <Input
                        id="global-margin"
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 40"
                        value={globalMargin}
                        onChange={(e) => setGlobalMargin(e.target.value)}
                        className="w-20 h-7 text-xs bg-input-calc text-center px-1 font-bold"
                    />
                    <Button onClick={applyGlobalMargin} size="icon" className="h-7 w-7">
                        <ChevronsRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xml"
                />
            </div>

            {nfeInfo && items.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted space-y-2">
                    <h3 className="text-lg font-medium text-xs sm:text-sm">Informações da NF-e</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                        <div><strong>Emitente:</strong> <span className="text-muted-foreground">{nfeInfo.emitterName}</span></div>
                        <div><strong>CNPJ:</strong> <span className="text-muted-foreground">{nfeInfo.emitterCnpj}</span></div>
                        <div><strong>NF-e Nº:</strong> <span className="text-muted-foreground">{nfeInfo.nfeNumber}</span></div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="min-w-[250px] sticky left-0 bg-background/95 backdrop-blur-sm z-10">Descrição</TableHead>
                            <TableHead className="w-[100px] text-right">Qtde</TableHead>
                            <TableHead className="w-[80px]">Fator</TableHead>
                            <TableHead className="w-[120px]">C. Orig. Un.</TableHead>
                            <TableHead className="w-[120px]">Impostos (+)</TableHead>
                            <TableHead className="w-[120px]">Desconto (-)</TableHead>
                            <TableHead className="w-[120px]">C. Final Un.</TableHead>
                            <TableHead className="w-[120px]">Margem (%)</TableHead>
                            <TableHead className="w-[110px]">Imp. Venda (%)</TableHead>
                            <TableHead className="w-[120px]">Venda Un.</TableHead>
                            <TableHead className="w-[120px]">Venda Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => {
                            const quantity = parseFloat(item.quantity) || 0;
                            const fator = parseFloat(item.fatorConversao || "1") || 1;
                            const price = parseFloat(item.price) || 0;
                            const totalSale = quantity * fator * price;
                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="sticky left-0 bg-background/95 backdrop-blur-sm z-10 font-medium">
                                        <Input type="text" placeholder="Nome do produto" value={item.description}
                                            onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="bg-input-calc text-xs" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" value={item.quantity}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'quantity', val); }} className="bg-input-calc text-right" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" placeholder="1" value={item.fatorConversao || "1"}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'fatorConversao', val); }} className="bg-input-calc font-bold text-accent-blue text-center" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" value={item.originalCost}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'originalCost', val); }} className="bg-input-calc text-right" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" value={item.impostos}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'impostos', val); }} className="bg-input-calc text-right" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" value={item.desconto}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'desconto', val); }} className="bg-input-calc text-right" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" value={item.finalCost ? Number(item.finalCost).toFixed(4) : ""} className="bg-input-calc text-right" disabled />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" value={item.margin}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'margin', val); }} className="bg-input-calc text-right" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" placeholder="0" value={item.impostoSobreVenda || ""}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'impostoSobreVenda', val); }} className="bg-input-calc text-right" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="text" inputMode="decimal" value={item.price}
                                            onChange={e => { const val = e.target.value.replace(',', '.'); if (val === '' || !isNaN(Number(val))) handleItemChange(item.id, 'price', val); }} className="bg-input-calc text-right font-semibold text-primary" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center justify-end text-sm font-bold">
                                            {formatCurrency(totalSale)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="h-8 w-8 hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                    <TableFooter className="bg-muted">
                        <TableRow>
                            <TableCell colSpan={7} className="text-right font-bold">Totais:</TableCell>
                            <TableCell className="font-bold text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    <span>Média</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Média de margem sobre o custo total</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </TableCell>
                            <TableCell className="font-bold">
                                <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm font-bold">
                                    {`${formatNumber(totals.averageMargin)}%`}
                                </div>
                            </TableCell>
                            <TableCell className="font-bold">
                                <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm font-bold">
                                    {formatCurrency(totals.totalSaleValue)}
                                </div>
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button onClick={addItem} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Item
                </Button>
                <Button onClick={() => setItems([{ id: 1, description: "", quantity: "1", originalCost: "", impostos: "", desconto: "", finalCost: "", margin: "", price: "" }])} variant="ghost" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Tabela
                </Button>
            </div>
        </div>
    );
}


'use client';

import { useState, useRef, useCallback } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { useToast } from '@/hooks/use-toast';

// --- Tipos exportados para serem usados pelos componentes ---

export interface NfeInfo {
    emitterName: string;
    emitterCnpj: string;
    nfeNumber: string;
}

export interface NfeProductDetail {
    prod: Record<string, string>;
    imposto: Record<string, Record<string, Record<string, string>>>;
}

export interface InfNFe {
    ['@_Id']: string;
    ide: { nNF: string };
    emit: { xNome: string; CNPJ: string };
    det: NfeProductDetail[];
    total: {
        ICMSTot: {
            vProd: string;
            vFrete: string;
            vSeg: string;
            vDesc: string;
            vOutro: string;
            vST: string;
            vIPI: string;
        }
    }
}

export interface NfeData {
    infNFe: InfNFe;
    det: NfeProductDetail[];
}

interface NfeParserProps {
    onNfeProcessed: (data: NfeData | null) => void;
}

// --- O Hook ---

export function useNfeParser({ onNfeProcessed }: NfeParserProps) {
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const processXml = useCallback((xmlData: string, currentFileName: string) => {
        try {
            const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
            const jsonObj = parser.parse(xmlData);

            const infNFe: InfNFe | undefined = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
            if (!infNFe) {
                throw new Error("Estrutura do XML da NF-e inválida: <infNFe> não encontrado.");
            }

            const dets: NfeProductDetail[] = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
            const total = infNFe.total?.ICMSTot;

            if (!dets || !total) {
                throw new Error("Estrutura do XML da NF-e inválida: <det> ou <ICMSTot> não encontrados.");
            }

            onNfeProcessed({ infNFe, det: dets });
            setFileName(currentFileName);

        } catch (error: unknown) {
            console.error("Erro ao processar o XML:", error);
            const message = error instanceof Error ? error.message : "Não foi possível ler o arquivo XML. Verifique se o formato é uma NF-e válida.";
            
            toast({
                variant: "destructive",
                title: "Erro de Importação",
                description: message,
            });

            onNfeProcessed(null);
            setFileName(null);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [onNfeProcessed, toast]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const xmlData = e.target?.result as string;
            processXml(xmlData, file.name);
        };
        reader.readAsText(file, 'ISO-8859-1'); // Encoding para NF-e
    }, [processXml]);

    const clearNfeData = useCallback(() => {
        setFileName(null);
        onNfeProcessed(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [onNfeProcessed]);

    return {
        fileName,
        handleFileChange,
        clearNfeData,
        fileInputRef
    };
}

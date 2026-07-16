
'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseNfeXml, ParsedNfe } from '@/lib/nfe-parser';
import { useNfeStore } from '@/store/use-nfe-store';

interface NfeParserProps {
    onNfeProcessed?: (data: ParsedNfe | null) => void;
}

export function useNfeParser({ onNfeProcessed }: NfeParserProps = {}) {
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { addNfe, setCurrentNfe } = useNfeStore();

    const processXml = useCallback((xmlData: string, currentFileName: string) => {
        try {
            const parsedNfe = parseNfeXml(xmlData);
            
            // Sincroniza com a store global
            addNfe(parsedNfe);
            setCurrentNfe(parsedNfe);

            if (onNfeProcessed) {
                onNfeProcessed(parsedNfe);
            }
            
            setFileName(currentFileName);

            toast({
                title: "Sucesso!",
                description: `NF-e ${parsedNfe.header.nNF} importada com sucesso.`,
            });

        } catch (error: unknown) {
            console.error("Erro ao processar o XML:", error);
            const message = error instanceof Error ? error.message : "Não foi possível ler o arquivo XML. Verifique se o formato é uma NF-e válida.";
            
            toast({
                variant: "destructive",
                title: "Erro de Importação",
                description: message,
            });

            if (onNfeProcessed) onNfeProcessed(null);
            setFileName(null);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [onNfeProcessed, toast, addNfe, setCurrentNfe]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const xmlData = e.target?.result as string;
                processXml(xmlData, file.name);
            };
            reader.readAsText(file, 'ISO-8859-1'); // Encoding para NF-e
        });
    }, [processXml]);

    const clearNfeData = useCallback(() => {
        setFileName(null);
        if (onNfeProcessed) onNfeProcessed(null);
        setCurrentNfe(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [onNfeProcessed, setCurrentNfe]);

    return {
        fileName,
        handleFileChange,
        clearNfeData,
        setFileName,
        fileInputRef,
        processXml
    };
}

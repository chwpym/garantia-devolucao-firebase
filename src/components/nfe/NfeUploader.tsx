
'use client';

import { Upload, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNfeParser } from '@/hooks/use-nfe-parser';
import { useNfeStore } from '@/store/use-nfe-store';

export function NfeUploader() {
    const { currentNfe, clearAll } = useNfeStore();
    const { handleFileChange, fileInputRef } = useNfeParser();

    if (currentNfe) {
        return (
            <div className="flex items-center gap-2 p-2 border rounded-xl bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">NF-e Carregada</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                        {currentNfe.header.nNF} - {currentNfe.emit.xNome}
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearAll} 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                    <FileX className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="relative">
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="h-11 px-6 shadow-md hover:shadow-lg transition-all"
            >
                <Upload className="mr-2 h-4 w-4" />
                Importar XML da NF-e
            </Button>
            <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept=".xml"
            />
        </div>
    );
}

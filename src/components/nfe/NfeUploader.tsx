'use client';

import { Upload, FileX, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNfeParser } from '@/hooks/use-nfe-parser';
import { useNfeStore } from '@/store/use-nfe-store';

export function NfeUploader() {
    const { currentNfe, allNfes, setCurrentNfe, clearAll } = useNfeStore();
    const { handleFileChange, fileInputRef } = useNfeParser();

    return (
        <div className="flex flex-wrap items-center gap-2">
            {allNfes.length > 1 && (
                <Select
                    value={currentNfe?.header.chave || allNfes[0]?.header.chave}
                    onValueChange={(chave) => {
                        const found = allNfes.find(n => n.header.chave === chave);
                        if (found) setCurrentNfe(found);
                    }}
                >
                    <SelectTrigger className="h-10 w-[210px] rounded-xl text-xs font-black border-border bg-background/80 shadow-sm">
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-primary shrink-0" />
                        <SelectValue placeholder="Selecionar NF-e" />
                    </SelectTrigger>
                    <SelectContent>
                        {allNfes.map((nfe) => (
                            <SelectItem key={nfe.header.chave} value={nfe.header.chave || nfe.header.nNF || 'nfe'} className="text-xs font-bold">
                                NF {nfe.header.nNF} — {nfe.emit.xFant || nfe.emit.xNome?.slice(0, 18)} ({nfe.items.length} it.)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="relative">
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline"
                    className="h-10 px-4 shadow-sm border-primary/20 text-primary hover:bg-primary/5 transition-all bg-background/50 backdrop-blur-sm rounded-xl font-black text-xs"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {allNfes.length > 0 ? "Adicionar XMLs" : "Importar XMLs"}
                </Button>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".xml"
                    multiple
                />
            </div>

            {allNfes.length > 0 && (
                <div className="flex items-center gap-1.5 p-1.5 px-3 border rounded-full bg-accent/30 border-border animate-in fade-in slide-in-from-right-1">
                    <span className="text-[10px] font-black text-foreground/70 uppercase tracking-tighter">
                        {allNfes.length} XML{allNfes.length > 1 ? 's' : ''}
                    </span>
                    <div className="h-3 w-[1px] bg-border mx-1" />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={clearAll} 
                        title="Limpar todos os XMLs"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-full"
                    >
                        <FileX className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}

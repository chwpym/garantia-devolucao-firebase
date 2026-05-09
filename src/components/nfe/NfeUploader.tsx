
'use client';

import { Upload, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNfeParser } from '@/hooks/use-nfe-parser';
import { useNfeStore } from '@/store/use-nfe-store';

export function NfeUploader() {
    const { currentNfe, allNfes, clearAll } = useNfeStore();
    const { handleFileChange, fileInputRef } = useNfeParser();

    return (
        <div className="flex items-center gap-3">
            <div className="relative">
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline"
                    className="h-10 px-4 shadow-sm border-primary/20 text-primary hover:bg-primary/5 transition-all bg-background/50 backdrop-blur-sm"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {allNfes.length > 0 ? "Adicionar XML" : "Importar XML"}
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
                    <span className="text-[10px] font-black text-foreground/60 uppercase tracking-tighter">
                        {allNfes.length} XML{allNfes.length > 1 ? 's' : ''}
                    </span>
                    <div className="h-3 w-[1px] bg-border mx-1" />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={clearAll} 
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-full"
                    >
                        <FileX className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}

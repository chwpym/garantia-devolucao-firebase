'use client'

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Lote } from "@/lib/types";
import { PlusCircle } from "lucide-react";

interface AddToLoteDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    lotes: Lote[];
    onConfirm: (loteId: number) => void;
    selectedCount: number;
    onGoToLotes: () => void;
}

export default function AddToLoteDialog({ isOpen, onOpenChange, lotes, onConfirm, selectedCount, onGoToLotes }: AddToLoteDialogProps) {
    const [selectedLote, setSelectedLote] = useState<string>("");

    const handleConfirm = () => {
        if (selectedLote) {
            onConfirm(parseInt(selectedLote, 10));
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Garantias ao Lote</DialogTitle>
                    <DialogDescription>
                        Você selecionou {selectedCount} garantia(s). Escolha um lote com status &quot;Aberto&quot; para adicioná-las.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    <Select onValueChange={setSelectedLote} value={selectedLote}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um lote..." />
                        </SelectTrigger>
                        <SelectContent>
                            {lotes.length > 0 ? (
                                lotes.map(lote => (
                                    <SelectItem key={lote.id} value={lote.id!.toString()}>
                                        {lote.nome}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">Nenhum lote aberto encontrado.</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="secondary" onClick={onGoToLotes}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Novo Lote
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={handleConfirm} disabled={!selectedLote}>Confirmar e Adicionar</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

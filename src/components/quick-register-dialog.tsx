'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import ProductForm from './product-form';
import SupplierForm from './supplier-form';
import PersonForm from './person-form';
import { useAppStore } from '@/store/app-store';

interface QuickRegisterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'product' | 'supplier' | 'person' | null;
    onSuccess?: (item: any) => void;
}

export function QuickRegisterDialog({
    open,
    onOpenChange,
    type,
    onSuccess
}: QuickRegisterDialogProps) {
    const reloadData = useAppStore(state => state.reloadData);

    const getTitle = () => {
        switch (type) {
            case 'product': return 'Cadastro Rápido de Produto';
            case 'supplier': return 'Cadastro Rápido de Fornecedor';
            case 'person': return 'Cadastro Rápido de Cliente/Mecânico';
            default: return 'Cadastro Rápido';
        }
    };

    const handleSave = async (item: any) => {
        // Reload local data in store to ensure it appears in comboboxes
        if (type === 'product') await reloadData('products');
        if (type === 'supplier') await reloadData('suppliers');
        if (type === 'person') await reloadData('persons');

        if (onSuccess) {
            onSuccess(item);
        }
        onOpenChange(false);
    };

    if (!type) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>

                <div className="py-2">
                    {type === 'product' && (
                        <ProductForm onSave={handleSave} />
                    )}
                    {type === 'supplier' && (
                        <SupplierForm onSave={handleSave} isModal />
                    )}
                    {type === 'person' && (
                        <PersonForm onSave={handleSave} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

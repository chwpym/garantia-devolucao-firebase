'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'warranty' | 'lote' | 'devolucao' | 'acao';

interface StatusBadgeProps {
    type: StatusType;
    status?: string;
    className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
    if (!status) {
        return <Badge variant="secondary" className={className}>N/A</Badge>;
    }

    const getVariant = (): any => {
        switch (type) {
            case 'warranty':
                switch (status) {
                    case 'Aprovada - Peça Nova':
                        return 'accent-green';
                    case 'Aprovada - Crédito Boleto':
                        return 'accent-green-dark';
                    case 'Aprovada - Crédito NF':
                        return 'default';
                    case 'Recusada':
                        return 'destructive';
                    case 'Enviado para Análise':
                        return 'accent-blue';
                    case 'Aguardando Envio':
                        return 'warning';
                    default:
                        return 'secondary';
                }
            case 'lote':
                switch (status) {
                    case 'Enviado':
                        return 'accent-blue';
                    case 'Aprovado Totalmente':
                    case 'Aprovado Parcialmente':
                        return 'accent-green';
                    case 'Recusado':
                        return 'destructive';
                    case 'Aberto':
                    default:
                        return 'secondary';
                }
            case 'devolucao':
                switch (status) {
                    case 'Recebido':
                        return 'accent-blue';
                    case 'Aguardando Peças':
                        return 'warning';
                    case 'Finalizada':
                        return 'success';
                    case 'Cancelada':
                        return 'destructive';
                    default:
                        return 'outline';
                }
            case 'acao':
                switch (status) {
                    case 'Excluída':
                        return 'destructive';
                    case 'Alterada':
                    default:
                        return 'secondary';
                }
            default:
                return 'secondary';
        }
    };

    return (
        <Badge variant={getVariant()} className={cn("whitespace-nowrap", className)}>
            {status}
        </Badge>
    );
}

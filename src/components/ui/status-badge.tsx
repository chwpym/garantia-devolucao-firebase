'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

type StatusType = 'warranty' | 'lote' | 'devolucao' | 'acao' | 'acaoRequisicao';

interface StatusBadgeProps {
    type: StatusType;
    status?: string;
    className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
    const { statuses } = useAppStore();

    if (!status) {
        return <Badge variant="secondary" className={className}>N/A</Badge>;
    }

    // Map internal types to CustomStatus aplicavelEm types
    const typeMapping: Record<string, string> = {
        'warranty': 'garantia',
        'lote': 'lote',
        'devolucao': 'devolucao',
        'acao': 'acaoRequisicao',
        'acaoRequisicao': 'acaoRequisicao'
    };

    const targetType = typeMapping[type] || type;
    
    // Check for custom status color in the store
    const customStatus = statuses.find(s => 
        s.nome.toLowerCase() === status.toLowerCase() && 
        s.aplicavelEm.includes(targetType as any)
    );

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
            case 'acaoRequisicao':
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

    // If custom color exists, use it as inline style, otherwise use variant
    if (customStatus?.cor) {
        return (
            <Badge 
                style={{ backgroundColor: customStatus.cor, color: '#fff' }} 
                className={cn("whitespace-nowrap border-none", className)}
            >
                {status}
            </Badge>
        );
    }

    return (
        <Badge variant={getVariant()} className={cn("whitespace-nowrap", className)}>
            {status}
        </Badge>
    );
}

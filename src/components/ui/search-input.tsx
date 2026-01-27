import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onClear?: () => void;
    containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, value, onChange, onClear, ...props }, ref) => {
        return (
            <div className={cn("relative flex-1 max-w-sm", containerClassName)}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    className={cn("pl-9 pr-8", className)}
                    {...props}
                />
                {value && onClear && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Limpar busca</span>
                    </Button>
                )}
            </div>
        );
    }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };

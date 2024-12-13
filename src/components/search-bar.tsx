import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
  isPrecise: boolean;
  onPreciseChange: (precise: boolean) => void;
}

export function SearchBar({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Search...", 
  className,
  isPrecise,
  onPreciseChange 
}: SearchBarProps) {
  const isSAMAccountName = (query: string): boolean => {
    return /^[^@\s]+$/i.test(query);
  };

  return (
    <div className="relative w-full flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            if (isSAMAccountName(newValue) && !isPrecise) {
              onPreciseChange(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
          className={`w-full pl-14 pr-6 text-lg rounded-full ${className}`}
        />
      </div>
      <Toggle
        pressed={isPrecise || isSAMAccountName(value)}
        onPressedChange={onPreciseChange}
        disabled={isSAMAccountName(value)}
        className={cn(
          "min-w-[100px]",
          (isPrecise || isSAMAccountName(value))
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          isSAMAccountName(value) && "cursor-not-allowed opacity-50"
        )}
      >
        {isPrecise || isSAMAccountName(value) ? "Precise" : "Broad"}
      </Toggle>
    </div>
  );
}
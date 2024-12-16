import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

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
  return (
    <div className="relative w-full flex gap-3 items-center">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-full pl-10 h-12 text-base bg-background/50 backdrop-blur-sm pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Toggle
            pressed={isPrecise}
            onPressedChange={onPreciseChange}
            className="h-8 px-3 rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Target className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
      
      <Button 
        onClick={onSearch}
        size="lg"
        className="h-12 px-6"
      >
        Search
      </Button>
    </div>
  );
}
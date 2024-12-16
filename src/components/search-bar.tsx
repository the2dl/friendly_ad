import { Input } from '@/components/ui/input';
import { Search, Target } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={isPrecise}
                  onPressedChange={onPreciseChange}
                  className={cn(
                    "h-8 px-3 rounded-lg transition-all",
                    isPrecise 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {isPrecise ? (
                    <Target className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPrecise ? 'Precise search (exact match)' : 'Broad search (partial match)'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
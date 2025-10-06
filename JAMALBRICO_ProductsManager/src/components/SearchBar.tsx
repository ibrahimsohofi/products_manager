import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({ value, onChange, placeholder, onFocus, onBlur }: SearchBarProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 300); // 300ms delay

  // Update parent component when debounced value changes
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} autoComplete="off">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 pointer-events-none" />
        <Input
          type="text"
          autoComplete="off"
          placeholder={placeholder || t('products.search', 'Rechercher un produit...')}
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
        />
      </form>
    </div>
  );
}

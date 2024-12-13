import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departments, locations } from '@/data/mock-data';

interface FiltersProps {
  selectedDepartment: string;
  selectedLocation: string;
  onDepartmentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export function Filters({
  selectedDepartment,
  selectedLocation,
  onDepartmentChange,
  onLocationChange,
}: FiltersProps) {
  return (
    <div className="flex items-center space-x-4">
      <Select value={selectedLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((department) => (
            <SelectItem key={department} value={department}>
              {department}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
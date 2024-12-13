import { Group } from '@/types/group';
import { GroupCard } from './group-card';

interface GroupGridProps {
  groups: Group[];
  onGroupSelect: (group: Group) => void;
}

export function GroupGrid({ groups, onGroupSelect }: GroupGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onClick={() => onGroupSelect(group)}
        />
      ))}
    </div>
  );
}
import { Group } from '@/types/group';
import { GroupCard } from './group-card';

interface GroupGridProps {
  groups: Group[];
  onGroupSelect: (group: Group) => void;
}

export function GroupGrid({ groups, onGroupSelect }: GroupGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
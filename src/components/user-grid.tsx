import { User } from '@/types/user';
import { UserCard } from './user-card';

interface UserGridProps {
  users: User[];
  onUserSelect: (user: User) => void;
}

export function UserGrid({ users, onUserSelect }: UserGridProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onClick={onUserSelect}
        />
      ))}
    </div>
  );
}
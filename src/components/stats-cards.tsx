import {
  Users,
  Building2,
  Globe2,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types/user';

interface StatsCardsProps {
  users: User[];
}

export function StatsCards({ users }: StatsCardsProps) {
  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const departments = new Set(users.map(user => user.department)).size;
  const locations = new Set(users.map(user => user.location)).size;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      description: 'Total users in directory',
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: Shield,
      description: 'Currently active users',
    },
    {
      title: 'Departments',
      value: departments,
      icon: Building2,
      description: 'Active departments',
    },
    {
      title: 'Locations',
      value: locations,
      icon: Globe2,
      description: 'Global office locations',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
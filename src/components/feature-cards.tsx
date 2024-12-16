import {
  Users,
  Building2,
  Globe2,
  Shield,
  Search,
  LucideIcon,
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

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg transition-all">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative space-y-4">
        <div className="inline-flex p-3 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        
        <h3 className="font-semibold text-lg">{title}</h3>
        
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export function FeatureCards() {
  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description: "Find users and groups quickly with intelligent search capabilities"
    },
    // ... other features
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
}
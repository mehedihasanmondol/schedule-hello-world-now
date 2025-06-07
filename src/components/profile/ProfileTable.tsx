
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { Profile } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProfileTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onManageBank?: (profile: Profile) => void;
}

export const ProfileTable = ({ profiles, onEdit, onDelete, onManageBank }: ProfileTableProps) => {
  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      employee: 'Employee',
      accountant: 'Accountant',
      operation: 'Operations',
      sales_manager: 'Sales Manager'
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead className="w-[120px]">Role</TableHead>
            <TableHead className="hidden lg:table-cell">Hourly Rate</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="hidden xl:table-cell">Created</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium text-sm">{profile.full_name || 'Unnamed User'}</div>
                  <div className="text-xs text-muted-foreground sm:hidden">{profile.email}</div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">{profile.email}</TableCell>
              <TableCell className="hidden md:table-cell text-sm">{profile.phone || 'N/A'}</TableCell>
              <TableCell className="text-sm">
                <span className="text-xs">{getRoleLabel(profile.role)}</span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm">
                <span className="font-medium text-green-600 text-xs">
                  ${(profile.hourly_rate || 0).toFixed(2)}/hr
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={profile.is_active ? "default" : "secondary"} className="text-xs">
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell text-sm">
                {new Date(profile.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(profile)} className="h-8 w-8 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  {onManageBank && (
                    <Button variant="ghost" size="sm" onClick={() => onManageBank(profile)} className="h-8 w-8 p-0 hidden sm:flex">
                      <CreditCard className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 h-8 w-8 p-0" onClick={() => onDelete(profile.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

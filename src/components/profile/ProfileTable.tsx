
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { Profile } from "@/types/database";

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
    <div className="overflow-x-auto min-w-full">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm">Name</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm hidden sm:table-cell">Email</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm hidden md:table-cell">Phone</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm">Role</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm hidden lg:table-cell">Hourly Rate</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm">Status</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm hidden xl:table-cell">Created</th>
            <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-600 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2 md:px-4">
                <div className="font-medium text-gray-900 text-sm">{profile.full_name || 'Unnamed User'}</div>
                <div className="text-xs text-gray-600 sm:hidden">{profile.email}</div>
              </td>
              <td className="py-3 px-2 md:px-4 text-gray-600 text-sm hidden sm:table-cell">{profile.email}</td>
              <td className="py-3 px-2 md:px-4 text-gray-600 text-sm hidden md:table-cell">{profile.phone || 'N/A'}</td>
              <td className="py-3 px-2 md:px-4 text-gray-600 text-sm">
                <span className="text-xs">{getRoleLabel(profile.role)}</span>
              </td>
              <td className="py-3 px-2 md:px-4 text-gray-600 text-sm hidden lg:table-cell">
                <span className="font-medium text-green-600 text-xs">
                  ${(profile.hourly_rate || 0).toFixed(2)}/hr
                </span>
              </td>
              <td className="py-3 px-2 md:px-4">
                <Badge variant={profile.is_active ? "default" : "secondary"} className="text-xs">
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="py-3 px-2 md:px-4 text-gray-600 text-sm hidden xl:table-cell">
                {new Date(profile.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-2 md:px-4">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

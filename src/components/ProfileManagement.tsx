
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileStats } from "./profile/ProfileStats";
import { ProfileForm } from "./profile/ProfileForm";
import { BankAccountManagement } from "./bank/BankAccountManagement";
import { DataTable } from "./common/DataTable/DataTable";
import { Column, TableData, TableFilters, ExportOptions } from "./common/DataTable/types";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CreditCard } from "lucide-react";

export const ProfileManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tableData, setTableData] = useState<TableData<Profile>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: false
  });
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    columnFilters: {},
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedProfileForBank, setSelectedProfileForBank] = useState<Profile | null>(null);
  const { toast } = useToast();

  const columns: Column<Profile>[] = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (value) => value || 'Unnamed User'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filterable: true,
      render: (value) => {
        const roleLabels: Record<string, string> = {
          admin: 'Administrator',
          employee: 'Employee',
          accountant: 'Accountant',
          operation: 'Operations',
          sales_manager: 'Sales Manager'
        };
        return roleLabels[value] || value;
      }
    },
    {
      key: 'hourly_rate',
      label: 'Hourly Rate',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">
          ${(value || 0).toFixed(2)}/hr
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, profile) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(profile)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProfileForBank(profile)}>
            <CreditCard className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(profile.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,role.ilike.%${filters.search}%`);
      }

      // Apply sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = (tableData.page - 1) * tableData.pageSize;
      const to = from + tableData.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setProfiles(data || []);
      setTableData(prev => ({
        ...prev,
        data: data || [],
        total: count || 0,
        hasMore: (count || 0) > (tableData.page * tableData.pageSize)
      }));
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.sortBy, filters.sortOrder, tableData.page, tableData.pageSize, toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleFiltersChange = useCallback((newFilters: TableFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setTableData(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setTableData(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setTableData(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const handleExport = async (options: ExportOptions) => {
    // Implementation for export functionality
    console.log('Export options:', options);
    toast({ title: "Export", description: `Exporting as ${options.format}...` });
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Profile deleted successfully" });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingProfile.id);

        if (error) throw error;
        toast({ title: "Success", description: "Profile updated successfully" });
      }
      
      setIsFormOpen(false);
      setEditingProfile(null);
      fetchProfiles();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
            <p className="text-gray-600">Manage user profiles and their information</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Profile
        </Button>
      </div>

      <ProfileStats profiles={profiles} />

      <DataTable
        columns={columns}
        data={tableData}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onExport={handleExport}
        enableExport={true}
        enableColumnToggle={true}
        className="w-full"
      />

      <ProfileForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProfile(null);
        }}
        onSubmit={handleSubmit}
        editingProfile={editingProfile}
        loading={formLoading}
      />

      <BankAccountManagement
        profileId={selectedProfileForBank?.id || ""}
        profileName={selectedProfileForBank?.full_name || ""}
        isOpen={!!selectedProfileForBank}
        onClose={() => setSelectedProfileForBank(null)}
      />
    </div>
  );
};

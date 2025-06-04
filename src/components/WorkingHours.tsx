import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Clock, CheckCircle, XCircle, DollarSign, Timer, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";
import { EditWorkingHoursDialog } from "@/components/EditWorkingHoursDialog";
import { DataTable } from "./common/DataTable/DataTable";
import { Column, TableData, TableFilters, ExportOptions } from "./common/DataTable/types";

export const WorkingHoursComponent = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tableData, setTableData] = useState<TableData<WorkingHour>>({
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: new Date().toISOString().split('T')[0],
    start_time: "",
    end_time: "",
    sign_in_time: "",
    sign_out_time: "",
    hourly_rate: 0,
    notes: "",
    status: "pending" as "pending" | "approved" | "paid" | "rejected"
  });

  const columns: Column<WorkingHour>[] = [
    {
      key: 'profiles',
      label: 'Profile',
      sortable: true,
      filterable: true,
      render: (_, workingHour) => (
        <div>
          <div className="font-medium text-gray-900">{workingHour.profiles?.full_name || 'N/A'}</div>
          <div className="text-sm text-gray-600">{workingHour.profiles?.role || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'projects',
      label: 'Project',
      sortable: true,
      filterable: true,
      render: (_, workingHour) => (
        <div>
          <div className="font-medium text-gray-900">{workingHour.projects?.name || 'N/A'}</div>
          <div className="text-sm text-gray-600">{workingHour.clients?.company || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'scheduled_hours',
      label: 'Scheduled',
      render: (_, workingHour) => (
        <div className="text-sm">
          {workingHour.start_time} - {workingHour.end_time}
          <div className="text-xs text-gray-500">{workingHour.total_hours}h</div>
        </div>
      )
    },
    {
      key: 'actual_hours',
      label: 'Actual',
      render: (_, workingHour) => (
        <div className="text-sm">
          {workingHour.sign_in_time && workingHour.sign_out_time ? (
            <>
              {workingHour.sign_in_time} - {workingHour.sign_out_time}
              <div className="text-xs text-gray-500">{workingHour.actual_hours || 0}h</div>
            </>
          ) : (
            <span className="text-gray-400">Not recorded</span>
          )}
        </div>
      )
    },
    {
      key: 'overtime_hours',
      label: 'Overtime',
      render: (value) => (
        <div className={`text-sm font-medium ${(value || 0) > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
          {(value || 0).toFixed(1)}h
        </div>
      )
    },
    {
      key: 'payable_amount',
      label: 'Payable',
      sortable: true,
      render: (value, workingHour) => (
        <div className="text-sm font-medium text-purple-600">
          ${(value || 0).toFixed(2)}
          <div className="text-xs text-gray-500">${workingHour.hourly_rate || 0}/hr</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => {
        const variants = {
          approved: "default",
          pending: "secondary",
          rejected: "destructive",
          paid: "outline"
        } as const;
        return (
          <Badge variant={variants[value as keyof typeof variants] || "secondary"}>
            {value}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, workingHour) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEdit(workingHour)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {workingHour.status === "pending" && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateStatus(workingHour.id, "approved")}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateStatus(workingHour.id, "rejected")}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const fetchWorkingHours = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate),
          clients!working_hours_client_id_fkey (id, company),
          projects!working_hours_project_id_fkey (id, name)
        `, { count: 'exact' });

      // Apply search filter with proper syntax
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`profiles.full_name.ilike.%${searchTerm}%,projects.name.ilike.%${searchTerm}%,clients.company.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination - ensure we don't go beyond available data
      const from = (tableData.page - 1) * tableData.pageSize;
      const to = from + tableData.pageSize - 1;
      
      // Only apply range if we have data
      const countQuery = await supabase
        .from('working_hours')
        .select('*', { count: 'exact', head: true });
      
      const totalCount = countQuery.count || 0;
      
      if (from < totalCount) {
        query = query.range(from, to);
      } else if (totalCount > 0) {
        // Reset to first page if we're beyond available data
        setTableData(prev => ({ ...prev, page: 1 }));
        return;
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      const workingHoursData = (data || []).map(wh => ({
        ...wh,
        profiles: Array.isArray(wh.profiles) ? wh.profiles[0] : wh.profiles,
        clients: Array.isArray(wh.clients) ? wh.clients[0] : wh.clients,
        projects: Array.isArray(wh.projects) ? wh.projects[0] : wh.projects
      }));
      
      setTableData(prev => ({
        ...prev,
        data: workingHoursData as WorkingHour[],
        total: count || 0,
        hasMore: (count || 0) > (tableData.page * tableData.pageSize)
      }));
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast({
        title: "Error",
        description: "Failed to fetch working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.sortBy, filters.sortOrder, tableData.page, tableData.pageSize, toast]);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company');

      if (error) throw error;
      setClients(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, [fetchProfiles, fetchClients, fetchProjects]);

  useEffect(() => {
    fetchWorkingHours();
  }, [fetchWorkingHours]);

  useEffect(() => {
    if (isDialogOpen && !editingWorkingHour) {
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [isDialogOpen, editingWorkingHour]);

  const handleFiltersChange = useCallback((newFilters: TableFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 only when search changes, not when sorting
    if (newFilters.search !== undefined) {
      setTableData(prev => ({ ...prev, page: 1 }));
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setTableData(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setTableData(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const handleExport = useCallback(async (options: ExportOptions) => {
    console.log('Export options:', options);
    toast({ title: "Export", description: `Exporting as ${options.format}...` });
  }, [toast]);

  const calculateTotalHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(0, diffHours);
  };

  const calculateActualHours = (signInTime: string, signOutTime: string) => {
    if (!signInTime || !signOutTime) return 0;
    return calculateTotalHours(signInTime, signOutTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      const actualHours = calculateActualHours(formData.sign_in_time, formData.sign_out_time);
      const overtimeHours = Math.max(0, actualHours - totalHours);
      const payableAmount = (actualHours || totalHours) * formData.hourly_rate;
      
      const { error } = await supabase
        .from('working_hours')
        .insert([{
          ...formData,
          total_hours: totalHours,
          actual_hours: actualHours || null,
          overtime_hours: overtimeHours,
          payable_amount: payableAmount,
          sign_in_time: formData.sign_in_time || null,
          sign_out_time: formData.sign_out_time || null
        }]);

      if (error) throw error;
      toast({ title: "Success", description: "Working hours logged successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        date: new Date().toISOString().split('T')[0],
        start_time: "",
        end_time: "",
        sign_in_time: "",
        sign_out_time: "",
        hourly_rate: 0,
        notes: "",
        status: "pending"
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast({
        title: "Error",
        description: "Failed to save working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('working_hours')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Working hours ${status} successfully` 
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (workingHour: WorkingHour) => {
    setEditingWorkingHour(workingHour);
    setIsEditDialogOpen(true);
  };

  // Calculate stats from current data
  const stats = {
    totalEntries: tableData.total,
    totalHours: tableData.data.reduce((sum, wh) => sum + (wh.actual_hours || wh.total_hours), 0),
    overtimeHours: tableData.data.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0),
    totalPayable: tableData.data.reduce((sum, wh) => sum + (wh.payable_amount || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Working Hours</h1>
            <p className="text-gray-600">Track actual hours, overtime, and payroll calculations</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Log Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Enhanced Working Hours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProfileSelector
                profiles={profiles}
                selectedProfileId={formData.profile_id}
                onProfileSelect={(profileId) => {
                  const profile = profiles.find(p => p.id === profileId);
                  setFormData({ 
                    ...formData, 
                    profile_id: profileId,
                    hourly_rate: profile?.hourly_rate || 0
                  });
                }}
                label="Select Profile"
                placeholder="Choose a team member"
                showRoleFilter={true}
              />
              
              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project_id">Project</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Scheduled Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Actual Hours (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sign_in_time">Sign In Time</Label>
                      <Input
                        id="sign_in_time"
                        type="time"
                        value={formData.sign_in_time}
                        onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sign_out_time">Sign Out Time</Label>
                      <Input
                        id="sign_out_time"
                        type="time"
                        value={formData.sign_out_time}
                        onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this work session..."
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Log Hours"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">All logged hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Timer className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalHours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Actual hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overtime Hours</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.overtimeHours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Extra hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payable</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${stats.totalPayable.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total amount due</p>
          </CardContent>
        </Card>
      </div>

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

      <EditWorkingHoursDialog
        workingHour={editingWorkingHour}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingWorkingHour(null);
        }}
        onUpdate={fetchWorkingHours}
        profiles={profiles}
        clients={clients}
        projects={projects}
      />
    </div>
  );
};

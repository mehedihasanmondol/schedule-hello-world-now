import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Project, Client } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "./common/DataTable/DataTable";
import { Column, TableData, TableFilters, ExportOptions } from "./common/DataTable/types";

interface ProjectWithClient extends Omit<Project, 'clients'> {
  clients: {
    id: string;
    name: string;
    company: string;
  } | null;
}

export const ProjectManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [tableData, setTableData] = useState<TableData<ProjectWithClient>>({
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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    status: "active" as "active" | "completed" | "on-hold",
    start_date: "",
    end_date: "",
    budget: 0
  });

  const columns: Column<ProjectWithClient>[] = [
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
      filterable: true,
      render: (value) => <span className="font-medium text-gray-900">{value}</span>
    },
    {
      key: 'clients',
      label: 'Client',
      sortable: true,
      filterable: true,
      render: (_, project) => project.clients?.company || 'N/A'
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => value ? (
        <span className="text-sm text-gray-600 truncate max-w-xs block">
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </span>
      ) : '-'
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">
          ${value.toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => {
        const variants = {
          active: "default",
          completed: "secondary",
          "on-hold": "destructive"
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
      render: (_, project) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(project.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients!projects_client_id_fkey (
            id,
            name,
            company
          )
        `, { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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

      setTableData(prev => ({
        ...prev,
        data: (data || []) as ProjectWithClient[],
        total: count || 0,
        hasMore: (count || 0) > (tableData.page * tableData.pageSize)
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.sortBy, filters.sortOrder, tableData.page, tableData.pageSize, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company');

      if (error) throw error;
      setClients((data || []) as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

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
    console.log('Export options:', options);
    toast({ title: "Export", description: `Exporting as ${options.format}...` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        ...formData,
        end_date: formData.end_date || null
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
        toast({ title: "Success", description: "Project updated successfully" });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        toast({ title: "Success", description: "Project added successfully" });
      }

      setIsDialogOpen(false);
      setEditingProject(null);
      setFormData({ name: "", description: "", client_id: "", status: "active", start_date: "", end_date: "", budget: 0 });
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: ProjectWithClient) => {
    setEditingProject(project as Project);
    setFormData({
      name: project.name,
      description: project.description || "",
      client_id: project.client_id,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date || "",
      budget: project.budget
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Project deleted successfully" });
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  // Calculate stats from current data
  const stats = {
    total: tableData.total,
    active: tableData.data.filter(p => p.status === "active").length,
    completed: tableData.data.filter(p => p.status === "completed").length,
    totalBudget: tableData.data.reduce((sum, p) => sum + p.budget, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={() => {
              setEditingProject(null);
              setFormData({ name: "", description: "", client_id: "", status: "active", start_date: "", end_date: "", budget: 0 });
            }}>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company} ({client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "completed" | "on-hold") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingProject ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
            <FolderOpen className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            <FolderOpen className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <FolderOpen className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
            <FolderOpen className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${stats.totalBudget.toLocaleString()}
            </div>
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
    </div>
  );
};

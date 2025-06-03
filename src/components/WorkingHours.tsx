import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Clock, Users, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHours as WorkingHoursType, Profile, Client, Project, Roster } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EditWorkingHoursDialog } from "@/components/EditWorkingHoursDialog";

export const WorkingHours = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHoursType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHours, setEditingHours] = useState<WorkingHoursType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    roster_id: "",
    date: "",
    start_time: "",
    end_time: "",
    sign_in_time: "",
    sign_out_time: "",
    total_hours: 0,
    actual_hours: 0,
    overtime_hours: 0,
    hourly_rate: 0,
    payable_amount: 0,
    notes: "",
    status: "pending" as const
  });

  useEffect(() => {
    fetchWorkingHours();
    fetchProfiles();
    fetchClients();
    fetchProjects();
    fetchRosters();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, email),
          clients!working_hours_client_id_fkey (id, company),
          projects!working_hours_project_id_fkey (id, name),
          rosters!working_hours_roster_id_fkey (id, name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkingHours(data as WorkingHoursType[]);
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
  };

  const fetchProfiles = async () => {
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
  };

  const fetchClients = async () => {
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
  };

  const fetchProjects = async () => {
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
  };

  const fetchRosters = async () => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRosters(data as Roster[]);
    } catch (error) {
      console.error('Error fetching rosters:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('working_hours')
        .insert([{
          profile_id: formData.profile_id,
          client_id: formData.client_id,
          project_id: formData.project_id,
          roster_id: formData.roster_id || null,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          sign_in_time: formData.sign_in_time || null,
          sign_out_time: formData.sign_out_time || null,
          total_hours: formData.total_hours,
          actual_hours: formData.actual_hours,
          overtime_hours: formData.overtime_hours,
          hourly_rate: formData.hourly_rate,
          payable_amount: formData.payable_amount,
          notes: formData.notes,
          status: formData.status
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Working hours saved successfully" });
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        roster_id: "",
        date: "",
        start_time: "",
        end_time: "",
        sign_in_time: "",
        sign_out_time: "",
        total_hours: 0,
        actual_hours: 0,
        overtime_hours: 0,
        hourly_rate: 0,
        payable_amount: 0,
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

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
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

  const deleteWorkingHours = async (id: string) => {
    if (!confirm('Are you sure you want to delete these working hours?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: "Working hours deleted successfully" 
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error deleting working hours:', error);
      toast({
        title: "Error",
        description: "Failed to delete working hours",
        variant: "destructive"
      });
    }
  };

  const filteredWorkingHours = workingHours.filter(hours =>
    (hours.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hours.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Working Hours Management</h1>
            <p className="text-gray-600">Track and manage employee working hours efficiently</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Working Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Working Hours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="profile_id">Employee</Label>
                <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="roster_id">Roster (Optional)</Label>
                <Select value={formData.roster_id} onValueChange={(value) => setFormData({ ...formData, roster_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roster" />
                  </SelectTrigger>
                  <SelectContent>
                    {rosters.map((roster) => (
                      <SelectItem key={roster.id} value={roster.id}>
                        {roster.name}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sign_in_time">Sign In Time (Optional)</Label>
                  <Input
                    id="sign_in_time"
                    type="time"
                    value={formData.sign_in_time}
                    onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sign_out_time">Sign Out Time (Optional)</Label>
                  <Input
                    id="sign_out_time"
                    type="time"
                    value={formData.sign_out_time}
                    onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_hours">Total Hours</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    step="0.01"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payable_amount">Payable Amount</Label>
                <Input
                  id="payable_amount"
                  type="number"
                  step="0.01"
                  value={formData.payable_amount}
                  onChange={(e) => setFormData({ ...formData, payable_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for these working hours..."
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Working Hours"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredWorkingHours.length}</div>
            <p className="text-xs text-muted-foreground">All recorded entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredWorkingHours.reduce((sum, hours) => sum + hours.total_hours, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Combined working hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payable</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${filteredWorkingHours.reduce((sum, hours) => sum + hours.payable_amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total amount to be paid</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Working Hours</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkingHours.map((hours) => (
                  <tr key={hours.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{hours.profiles?.full_name}</div>
                      <div className="text-sm text-gray-600">{hours.profiles?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{hours.projects?.name}</div>
                        <div className="text-sm text-gray-600">{hours.clients?.company}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(hours.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{hours.total_hours}</td>
                    <td className="py-3 px-4 text-gray-600">${hours.hourly_rate.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-600">${hours.payable_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        hours.status === "approved" ? "default" : 
                        hours.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {hours.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingHours(hours)}
                        >
                          Edit
                        </Button>
                        {hours.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(hours.id, "approved")}
                              className="text-green-600 hover:text-green-700"
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(hours.id, "rejected")}
                              className="text-red-600 hover:text-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteWorkingHours(hours.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditWorkingHoursDialog
        isOpen={editingHours !== null}
        onClose={() => setEditingHours(null)}
        workingHours={editingHours}
        fetchWorkingHours={fetchWorkingHours}
        profiles={profiles}
        clients={clients}
        projects={projects}
        rosters={rosters}
        toast={toast}
      />
    </div>
  );
};

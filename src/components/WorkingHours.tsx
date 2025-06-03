import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Clock, Users, DollarSign, Calendar, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour as WorkingHourType, Profile, Client, Project, Roster } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EditWorkingHoursDialog } from "@/components/EditWorkingHoursDialog";

export const WorkingHours = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorkingHour, setSelectedWorkingHour] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    roster_id: "",
    date: "",
    start_time: "",
    end_time: "",
    total_hours: 0,
    hourly_rate: 0,
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
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name),
          rosters!working_hours_roster_id_fkey (id, name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkingHours(data || []);
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
        .order('name');

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
        .order('date', { ascending: false });

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
      const payableAmount = formData.total_hours * formData.hourly_rate;
      
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
          total_hours: formData.total_hours,
          hourly_rate: formData.hourly_rate,
          payable_amount: payableAmount,
          notes: formData.notes,
          status: formData.status
        }]);

      if (error) throw error;
      
      toast({ title: "Success", description: "Working hours created successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        roster_id: "",
        date: "",
        start_time: "",
        end_time: "",
        total_hours: 0,
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

  const handleEditClick = (workingHour: any) => {
    setSelectedWorkingHour(workingHour);
    setIsEditDialogOpen(true);
  };

  if (loading && workingHours.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Working Hours</h1>
            <p className="text-gray-600">Track and manage employee working hours</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Working Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Working Hours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="profile_id">Employee</Label>
                <Select
                  value={formData.profile_id}
                  onValueChange={(value) => setFormData({ ...formData, profile_id: value })}
                >
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
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
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
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
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
                  <Label htmlFor="total_hours">Total Hours</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    step="0.5"
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Working Hours"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Working Hours Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workingHours.map((wh) => (
                  <tr key={wh.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{wh.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">{wh.clients?.company || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(wh.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {wh.start_time} - {wh.end_time}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{wh.total_hours}h</td>
                    <td className="py-3 px-4 text-gray-600">${wh.hourly_rate}/hr</td>
                    <td className="py-3 px-4 text-gray-600">${wh.payable_amount?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        wh.status === "approved" ? "default" : 
                        wh.status === "pending" ? "secondary" : "outline"
                      }>
                        {wh.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(wh)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedWorkingHour && (
        <EditWorkingHoursDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedWorkingHour(null);
          }}
          workingHour={selectedWorkingHour}
          onUpdate={fetchWorkingHours}
          profiles={profiles}
          clients={clients}
          projects={projects}
        />
      )}
    </div>
  );
};

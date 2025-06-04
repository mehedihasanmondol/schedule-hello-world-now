import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster as RosterType, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { MultipleProfileSelector } from "./common/MultipleProfileSelector";
import { EnhancedRosterCalendarView } from "./roster/EnhancedRosterCalendarView";

export const RosterComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<RosterType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    total_hours: 0,
    notes: "",
    status: "pending",
    name: "",
    expected_profiles: 1,
    per_hour_rate: 0
  });

  useEffect(() => {
    fetchRosters();
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchRosters = async () => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRosters(data as RosterType[]);
    } catch (error) {
      console.error('Error fetching rosters:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rosters",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rosterData = {
        ...formData,
        end_date: formData.end_date || null,
        status: formData.status as "pending" | "confirmed" | "cancelled"
      };

      if (editingRoster) {
        const { error } = await supabase
          .from('rosters')
          .update(rosterData)
          .eq('id', editingRoster.id);

        if (error) throw error;
        toast({ title: "Success", description: "Roster updated successfully" });
      } else {
        const { error } = await supabase
          .from('rosters')
          .insert([rosterData]);

        if (error) throw error;
        toast({ title: "Success", description: "Roster added successfully" });
      }

      setIsDialogOpen(false);
      setEditingRoster(null);
      setFormData({ 
        profile_id: "", 
        client_id: "", 
        project_id: "", 
        date: "", 
        end_date: "", 
        start_time: "", 
        end_time: "", 
        total_hours: 0, 
        notes: "", 
        status: "pending", 
        name: "", 
        expected_profiles: 1, 
        per_hour_rate: 0 
      });
      fetchRosters();
    } catch (error) {
      console.error('Error saving roster:', error);
      toast({
        title: "Error",
        description: "Failed to save roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roster: RosterType) => {
    setEditingRoster(roster);
    setFormData({
      profile_id: roster.profile_id,
      client_id: roster.client_id,
      project_id: roster.project_id,
      date: roster.date,
      end_date: roster.end_date || "",
      start_time: roster.start_time,
      end_time: roster.end_time,
      total_hours: roster.total_hours,
      notes: roster.notes || "",
      status: roster.status,
      name: roster.name,
      expected_profiles: roster.expected_profiles,
      per_hour_rate: roster.per_hour_rate
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this roster?")) return;

    try {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Roster deleted successfully" });
      fetchRosters();
    } catch (error) {
      console.error('Error deleting roster:', error);
      toast({
        title: "Error",
        description: "Failed to delete roster",
        variant: "destructive"
      });
    }
  };

  const filteredRosters = rosters.filter(roster =>
    roster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roster.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && rosters.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Roster Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={() => {
              setEditingRoster(null);
              setFormData({ 
                profile_id: "", 
                client_id: "", 
                project_id: "", 
                date: "", 
                end_date: "", 
                start_time: "", 
                end_time: "", 
                total_hours: 0, 
                notes: "", 
                status: "pending", 
                name: "", 
                expected_profiles: 1, 
                per_hour_rate: 0 
              });
            }}>
              <Plus className="h-4 w-4" />
              Add Roster
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRoster ? "Edit Roster" : "Add New Roster"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Roster Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="profile_id">Profile</Label>
                <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile" />
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
                    <SelectValue placeholder="Select a client" />
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
                    <SelectValue placeholder="Select a project" />
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

              <div className="grid grid-cols-2 gap-4">
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
                    step="0.01"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="per_hour_rate">Per Hour Rate</Label>
                  <Input
                    id="per_hour_rate"
                    type="number"
                    step="0.01"
                    value={formData.per_hour_rate}
                    onChange={(e) => setFormData({ ...formData, per_hour_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expected_profiles">Expected Profiles</Label>
                <Input
                  id="expected_profiles"
                  type="number"
                  value={formData.expected_profiles}
                  onChange={(e) => setFormData({ ...formData, expected_profiles: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingRoster ? "Update Roster" : "Add Roster"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <EnhancedRosterCalendarView rosters={rosters} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rosters</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search rosters..."
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRosters.map((roster) => (
                  <tr key={roster.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{roster.name}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.profile_id}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.client_id}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.project_id}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.date}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.total_hours}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        roster.status === "confirmed" ? "default" : 
                        roster.status === "pending" ? "secondary" : "destructive"
                      }>
                        {roster.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(roster)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(roster.id)}>
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export { RosterComponent as default };


import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Client, Project, Profile, Roster } from "@/types/database";

interface RosterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoster?: Roster | null;
  onRefresh: () => void;
}

export const RosterForm = ({ open, onOpenChange, editingRoster, onRefresh }: RosterFormProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    project_id: "",
    profile_id: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    expected_profiles: "1",
    per_hour_rate: "",
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchProjects();
      fetchProfiles();
      
      if (editingRoster) {
        setFormData({
          name: editingRoster.name || "",
          client_id: editingRoster.client_id || "",
          project_id: editingRoster.project_id || "",
          profile_id: editingRoster.profile_id || "",
          date: editingRoster.date || "",
          end_date: editingRoster.end_date || "",
          start_time: editingRoster.start_time || "",
          end_time: editingRoster.end_time || "",
          expected_profiles: editingRoster.expected_profiles?.toString() || "1",
          per_hour_rate: editingRoster.per_hour_rate?.toString() || "",
          notes: editingRoster.notes || ""
        });
      } else {
        setFormData({
          name: "",
          client_id: "",
          project_id: "",
          profile_id: "",
          date: "",
          end_date: "",
          start_time: "",
          end_time: "",
          expected_profiles: "1",
          per_hour_rate: "",
          notes: ""
        });
      }
    }
  }, [open, editingRoster]);

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

  const calculateTotalHours = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    
    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    
    if (end <= start) return 0;
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours();
      
      const rosterData = {
        name: formData.name,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        profile_id: formData.profile_id || null,
        date: formData.date,
        end_date: formData.end_date || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: totalHours,
        expected_profiles: parseInt(formData.expected_profiles) || 1,
        per_hour_rate: formData.per_hour_rate ? parseFloat(formData.per_hour_rate) : null,
        notes: formData.notes || null,
        status: 'pending'
      };

      if (editingRoster) {
        const { error } = await supabase
          .from('rosters')
          .update(rosterData)
          .eq('id', editingRoster.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Roster updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('rosters')
          .insert([rosterData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Roster created successfully",
        });
      }

      onOpenChange(false);
      onRefresh();
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

  const filteredProjects = projects.filter(p => 
    !formData.client_id || p.client_id === formData.client_id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRoster ? 'Edit Roster' : 'Create New Roster'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Roster Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter roster name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="expected_profiles">Expected Profiles *</Label>
              <Input
                id="expected_profiles"
                type="number"
                min="1"
                value={formData.expected_profiles}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_profiles: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_id">Client</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value, project_id: "" }))}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                disabled={!formData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="profile_id">Assign Profile</Label>
            <Select 
              value={formData.profile_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, profile_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} - {profile.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Start Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.date}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="per_hour_rate">Per Hour Rate (Optional)</Label>
            <Input
              id="per_hour_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.per_hour_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, per_hour_rate: e.target.value }))}
              placeholder="Leave empty to use profile rate"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {formData.start_time && formData.end_time && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Total Hours: {calculateTotalHours().toFixed(2)} hours
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingRoster ? 'Update Roster' : 'Create Roster'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

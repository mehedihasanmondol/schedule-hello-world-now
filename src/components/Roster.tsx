
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, List, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster as RosterType, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { RosterCalendarView } from "./RosterCalendarView";

export const Roster = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRosters();
  }, []);

  const fetchRosters = async () => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          *,
          profiles!rosters_profile_id_fkey (id, full_name, role),
          clients!rosters_client_id_fkey (id, company),
          projects!rosters_project_id_fkey (id, name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const rostersData = (data || []).map(roster => ({
        ...roster,
        profiles: Array.isArray(roster.profiles) ? roster.profiles[0] : roster.profiles,
        clients: Array.isArray(roster.clients) ? roster.clients[0] : roster.clients,
        projects: Array.isArray(roster.projects) ? roster.projects[0] : roster.projects
      }));

      setRosters(rostersData as RosterType[]);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredRosters = rosters.filter(roster =>
    (roster.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.clients?.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roster Management</h1>
            <p className="text-gray-600">Schedule and manage staff assignments</p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Roster
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rosters</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredRosters.length}</div>
            <p className="text-xs text-muted-foreground">All roster entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredRosters.filter(r => r.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRosters.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredRosters.filter(r => {
                const rosterDate = new Date(r.date);
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return rosterDate >= weekStart && rosterDate <= weekEnd;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Roster Schedule ({filteredRosters.length})</CardTitle>
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
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-6">
              <RosterCalendarView rosters={filteredRosters} />
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Expected</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRosters.map((roster) => (
                      <tr key={roster.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {roster.name || 'Unnamed Roster'}
                          </div>
                          {roster.notes && (
                            <div className="text-sm text-gray-600">{roster.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {roster.projects?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {roster.clients?.company || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>{formatDate(roster.date)}</div>
                          {roster.end_date && roster.end_date !== roster.date && (
                            <div className="text-sm text-gray-500">
                              to {formatDate(roster.end_date)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="text-sm">
                            {formatTime(roster.start_time)} - {formatTime(roster.end_time)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-blue-600">
                            {roster.total_hours || 0}h
                          </div>
                          {roster.per_hour_rate && roster.per_hour_rate > 0 && (
                            <div className="text-xs text-gray-500">
                              ${roster.per_hour_rate}/hr
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{roster.expected_profiles || 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            roster.status === "confirmed" ? "default" : 
                            roster.status === "pending" ? "secondary" : "outline"
                          }>
                            {roster.status || 'pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

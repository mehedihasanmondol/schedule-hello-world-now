
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Clock, Users, DollarSign, Settings, CheckCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface RosterCalendarViewProps {
  rosters: Roster[];
  onRefresh: () => void;
  onEdit?: (roster: Roster) => void;
}

export const RosterCalendarView = ({ rosters, onRefresh, onEdit }: RosterCalendarViewProps) => {
  const [rosterProfiles, setRosterProfiles] = useState<Record<string, Profile[]>>({});
  const [expandedStaff, setExpandedStaff] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchRosterProfiles();
  }, [rosters]);

  const fetchRosterProfiles = async () => {
    const profilesMap: Record<string, Profile[]> = {};
    
    for (const roster of rosters) {
      try {
        const { data, error } = await supabase
          .from('roster_profiles')
          .select(`
            profiles (id, full_name, role, hourly_rate)
          `)
          .eq('roster_id', roster.id);

        if (error) throw error;
        
        profilesMap[roster.id] = data?.map(rp => rp.profiles).filter(Boolean) as Profile[] || [];
      } catch (error) {
        console.error('Error fetching roster profiles:', error);
        profilesMap[roster.id] = [];
      }
    }
    
    setRosterProfiles(profilesMap);
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

  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'Time not set';
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (assignedProfiles: number, expectedProfiles: number) => {
    if (expectedProfiles === 0) return 0;
    return Math.min((assignedProfiles / expectedProfiles) * 100, 100);
  };

  const calculateTotalPayable = (roster: Roster, assignedProfiles: Profile[]) => {
    const hourlyRate = roster.per_hour_rate || 0;
    const totalHours = roster.total_hours || 0;
    
    if (hourlyRate > 0) {
      return assignedProfiles.length * hourlyRate * totalHours;
    }
    
    // Use individual profile rates if no roster rate is set
    return assignedProfiles.reduce((total, profile) => {
      return total + (profile.hourly_rate || 0) * totalHours;
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = async (rosterId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rosters')
        .update({ status: newStatus })
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Roster status updated to ${newStatus}`,
      });

      onRefresh();
    } catch (error) {
      console.error('Error updating roster status:', error);
      toast({
        title: "Error",
        description: "Failed to update roster status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (rosterId: string) => {
    if (!confirm("Are you sure you want to delete this roster?")) return;

    try {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Roster deleted successfully",
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting roster:', error);
      toast({
        title: "Error",
        description: "Failed to delete roster",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rosters.map((roster) => {
        const assignedProfiles = rosterProfiles[roster.id] || [];
        const expectedProfiles = roster.expected_profiles || 1;
        const unassignedCount = Math.max(0, expectedProfiles - assignedProfiles.length);
        const progress = calculateProgress(assignedProfiles.length, expectedProfiles);
        const totalPayable = calculateTotalPayable(roster, assignedProfiles);

        return (
          <Card key={roster.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {roster.name || 'Unnamed Roster'}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(roster.date)}
                    {roster.end_date && roster.end_date !== roster.date && (
                      <span>- {formatDate(roster.end_date)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {formatTimeRange(roster.start_time, roster.end_time)}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(roster.status || 'pending')}
                >
                  {roster.status || 'pending'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Project Info */}
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {roster.projects?.name || 'No Project'}
                </div>
                <div className="text-gray-600">
                  {roster.clients?.company || 'No Client'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Staff Assignment</span>
                  <span className="text-gray-600">
                    {assignedProfiles.length}/{expectedProfiles}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{assignedProfiles.length} assigned</span>
                  </div>
                  {unassignedCount > 0 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Users className="h-3 w-3" />
                      <span>{unassignedCount} unassigned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Profiles - Collapsible */}
              {assignedProfiles.length > 0 && (
                <Collapsible 
                  open={expandedStaff[roster.id]} 
                  onOpenChange={(open) => setExpandedStaff(prev => ({ ...prev, [roster.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                      <div className="text-sm font-medium text-gray-700">Assigned Staff:</div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedStaff[roster.id] ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2">
                    <div className="flex flex-wrap gap-1">
                      {assignedProfiles.map((profile) => (
                        <Badge key={profile.id} variant="secondary" className="text-xs">
                          {profile.full_name}
                        </Badge>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Total Hours and Payable - Side by Side */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {roster.total_hours || 0}h
                  </div>
                  <div className="text-xs text-gray-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600 flex items-center justify-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {totalPayable.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Est. Payable</div>
                </div>
              </div>

              {/* Rate Info */}
              {roster.per_hour_rate && roster.per_hour_rate > 0 && (
                <div className="text-center text-xs text-gray-600 bg-gray-50 rounded p-2">
                  Rate: ${roster.per_hour_rate}/hr per person
                </div>
              )}

              {/* Notes */}
              {roster.notes && (
                <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
                  <div className="font-medium mb-1">Notes:</div>
                  <div>{roster.notes}</div>
                </div>
              )}

              {/* Compact Manage Button */}
              <div className="flex justify-center pt-2 border-t">
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(roster)}
                      className="h-8 px-2"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleStatusChange(roster.id, roster.status === 'confirmed' ? 'pending' : 'confirmed')}
                    className="h-8 px-2"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {roster.status === 'confirmed' ? 'Pending' : 'Confirm'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(roster.id)}
                    className="text-red-600 hover:text-red-700 h-8 px-2"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

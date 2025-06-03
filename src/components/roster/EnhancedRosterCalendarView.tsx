
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Clock, Users, DollarSign, Calendar } from "lucide-react";
import { Roster } from "@/types/database";

interface EnhancedRosterCalendarViewProps {
  rosters: Roster[];
}

export const EnhancedRosterCalendarView = ({ rosters }: EnhancedRosterCalendarViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get start and end of current week (Monday to Sunday)
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeek);

  // Filter rosters for current week
  const weekRosters = rosters.filter(roster => {
    const rosterDate = new Date(roster.date);
    return rosterDate >= weekStart && rosterDate <= weekEnd;
  });

  // Group rosters by date
  const rostersByDate = weekRosters.reduce((acc, roster) => {
    const dateKey = roster.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(roster);
    return acc;
  }, {} as Record<string, Roster[]>);

  // Format time to human readable
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date range for multi-day rosters
  const formatDateRange = (roster: Roster) => {
    const startDate = new Date(roster.date);
    const endDate = roster.end_date ? new Date(roster.end_date) : startDate;
    
    if (roster.end_date && roster.end_date !== roster.date) {
      return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })}`;
    }
    return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate progress percentage
  const getProgressPercentage = (assigned: number, expected: number) => {
    if (expected === 0) return 0;
    return Math.min((assigned / expected) * 100, 100);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">
              Week of {weekStart.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(rostersByDate).map(([date, dateRosters]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 mb-3 border-b pb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </h3>
                <Badge variant="outline" className="ml-auto">
                  {dateRosters.length}
                </Badge>
              </div>
              
              {dateRosters.map((roster) => {
                const assignedCount = roster.roster_profiles?.length || 0;
                const expectedCount = roster.expected_profiles || 1;
                const estimatedValue = roster.total_hours * (roster.per_hour_rate || 0);
                const progressPercentage = getProgressPercentage(assignedCount, expectedCount);
                
                return (
                  <Card key={roster.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with status and date range */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {roster.name || 'Unnamed Roster'}
                            </h4>
                            {(roster.end_date && roster.end_date !== roster.date) && (
                              <div className="text-xs text-blue-600 font-medium mt-1 bg-blue-50 px-2 py-1 rounded">
                                {formatDateRange(roster)}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={
                              roster.status === "confirmed" ? "default" : 
                              roster.status === "pending" ? "secondary" : "outline"
                            } 
                            className="text-xs ml-2"
                          >
                            {roster.status}
                          </Badge>
                        </div>

                        {/* Time */}
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(roster.start_time)} - {formatTime(roster.end_time)}
                        </div>

                        {/* Project and Client */}
                        <div className="text-xs space-y-1">
                          <div className="font-medium text-gray-900">
                            {roster.projects?.name || 'No Project'}
                          </div>
                          <div className="text-gray-600">
                            {roster.clients?.company || 'No Client'}
                          </div>
                        </div>

                        {/* Metrics Row with Icons and Tooltips */}
                        <div className="flex items-center justify-between text-xs">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-purple-600">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{roster.total_hours}h</span>
                            </TooltipTrigger>
                            <TooltipContent>Total Hours</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-blue-600">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">{assignedCount}</span>
                            </TooltipTrigger>
                            <TooltipContent>Total Assigned</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">${estimatedValue.toFixed(2)}</span>
                            </TooltipTrigger>
                            <TooltipContent>Est. Value</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-orange-600">
                              <span className="text-xs font-bold">$</span>
                              <span className="font-medium">{roster.per_hour_rate || 0}</span>
                            </TooltipTrigger>
                            <TooltipContent>Per Hour</TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Team Progress</span>
                            <span className="text-gray-600">
                              {assignedCount}/{expectedCount}
                            </span>
                          </div>
                          <Progress 
                            value={progressPercentage} 
                            className="h-2"
                          />
                        </div>

                        {/* Team Members */}
                        <div className="flex flex-wrap gap-1">
                          {roster.roster_profiles?.slice(0, 2).map((rp) => (
                            <Badge key={rp.id} variant="secondary" className="text-xs">
                              {rp.profiles?.full_name}
                            </Badge>
                          ))}
                          {(roster.roster_profiles?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(roster.roster_profiles?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>

        {Object.keys(rostersByDate).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No rosters scheduled</h3>
            <p>No rosters found for the week of {weekStart.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Users, DollarSign, Calendar, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, Profile, WorkingHour, BankTransaction, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollGenerationWizard } from "./PayrollGenerationWizard";
import { SalarySheetManager } from "./SalarySheetManager";
import { SalaryReports } from "./SalaryReports";

export const SalarySystemDashboard = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [payrollsRes, profilesRes, workingHoursRes, transactionsRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from('payroll').select(`
          *,
          profiles!payroll_profile_id_fkey (id, full_name, email, role, hourly_rate, salary),
          bank_accounts (id, bank_name, account_number)
        `).order('created_at', { ascending: false }),
        
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
        
        supabase.from('working_hours').select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name)
        `).eq('status', 'approved').order('date', { ascending: false }),
        
        supabase.from('bank_transactions').select(`
          *,
          profiles!bank_transactions_profile_id_fkey (id, full_name),
          bank_accounts (id, bank_name, account_number)
        `).eq('category', 'salary').order('date', { ascending: false }),
        
        supabase.from('clients').select('*').eq('status', 'active').order('name'),
        
        supabase.from('projects').select('*').eq('status', 'active').order('name')
      ]);

      if (payrollsRes.error) throw payrollsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (workingHoursRes.error) throw workingHoursRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setPayrolls(payrollsRes.data as Payroll[]);
      setProfiles(profilesRes.data as Profile[]);
      setWorkingHours(workingHoursRes.data as WorkingHour[]);
      setBankTransactions(transactionsRes.data as BankTransaction[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
    } catch (error: any) {
      console.error('Error fetching salary data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch salary system data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to payrolls
  const getFilteredPayrolls = () => {
    return payrolls.filter(payroll => {
      if (statusFilter !== "all" && payroll.status !== statusFilter) return false;
      if (profileFilter !== "all" && payroll.profile_id !== profileFilter) return false;
      
      // For client and project filters, we need to check working hours data
      if (clientFilter !== "all" || projectFilter !== "all") {
        const relatedWorkingHours = workingHours.filter(wh => 
          wh.profile_id === payroll.profile_id &&
          wh.date >= payroll.pay_period_start &&
          wh.date <= payroll.pay_period_end
        );
        
        if (clientFilter !== "all") {
          const hasClientMatch = relatedWorkingHours.some(wh => wh.client_id === clientFilter);
          if (!hasClientMatch) return false;
        }
        
        if (projectFilter !== "all") {
          const hasProjectMatch = relatedWorkingHours.some(wh => wh.project_id === projectFilter);
          if (!hasProjectMatch) return false;
        }
      }
      
      return true;
    });
  };

  const filteredPayrolls = getFilteredPayrolls();
  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = workingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
  const totalSalaryTransactions = bankTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingPayrolls = filteredPayrolls.filter(p => p.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading salary system...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprehensive Salary System</h1>
            <p className="text-gray-600">Manage payroll, salary sheets, and reports</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPayroll.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Net pay amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Profiles</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payrolls</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPayrolls}</div>
            <p className="text-xs text-muted-foreground">Require processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Salary Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${totalSalaryTransactions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Bank transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="salary-sheets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="salary-sheets">Salary Sheets</TabsTrigger>
          <TabsTrigger value="payroll-generation">Payroll Generation</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="salary-sheets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Salary Sheets Management</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Profile Filter */}
                  <Select value={profileFilter} onValueChange={setProfileFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Client Filter */}
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Project Filter */}
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SalarySheetManager 
                payrolls={filteredPayrolls}
                profiles={profiles}
                onRefresh={fetchAllData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll-generation">
          <PayrollGenerationWizard 
            profiles={profiles}
            workingHours={workingHours}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="reports">
          <SalaryReports 
            payrolls={payrolls}
            workingHours={workingHours}
            bankTransactions={bankTransactions}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Users, DollarSign, Calendar, FileText, Filter } from "lucide-react";
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
  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  
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
        
        supabase.from('clients').select('*').eq('status', 'active').order('company'),
        
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

  // Filter data based on selected filters
  const getFilteredData = () => {
    let filteredPayrolls = payrolls;
    let filteredWorkingHours = workingHours;
    let filteredTransactions = bankTransactions;

    if (selectedProfile !== "all") {
      filteredPayrolls = filteredPayrolls.filter(p => p.profile_id === selectedProfile);
      filteredWorkingHours = filteredWorkingHours.filter(wh => wh.profile_id === selectedProfile);
      filteredTransactions = filteredTransactions.filter(t => t.profile_id === selectedProfile);
    }

    if (selectedClient !== "all") {
      filteredWorkingHours = filteredWorkingHours.filter(wh => wh.client_id === selectedClient);
    }

    if (selectedProject !== "all") {
      filteredWorkingHours = filteredWorkingHours.filter(wh => wh.project_id === selectedProject);
    }

    return {
      payrolls: filteredPayrolls,
      workingHours: filteredWorkingHours,
      bankTransactions: filteredTransactions
    };
  };

  const filteredData = getFilteredData();
  const totalPayroll = filteredData.payrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = filteredData.workingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
  const totalSalaryTransactions = filteredData.bankTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingPayrolls = filteredData.payrolls.filter(p => p.status === 'pending').length;

  const clearFilters = () => {
    setSelectedProfile("all");
    setSelectedClient("all");
    setSelectedProject("all");
  };

  const hasActiveFilters = selectedProfile !== "all" || selectedClient !== "all" || selectedProject !== "all";

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
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}>
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {hasActiveFilters && <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">•</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filter Data</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Profile</label>
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Profiles" />
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
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Client</label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Projects" />
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
              </div>
            </PopoverContent>
          </Popover>
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
          <SalarySheetManager 
            payrolls={filteredData.payrolls}
            profiles={profiles}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="payroll-generation">
          <PayrollGenerationWizard 
            profiles={profiles}
            workingHours={filteredData.workingHours}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="reports">
          <SalaryReports 
            payrolls={filteredData.payrolls}
            workingHours={filteredData.workingHours}
            bankTransactions={filteredData.bankTransactions}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

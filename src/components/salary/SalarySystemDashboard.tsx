
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Users, DollarSign, Calendar, FileText, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  
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

  // Filter data based on current filters
  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = payroll.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesProfile = selectedProfileId === "all" || payroll.profile_id === selectedProfileId;
    return matchesSearch && matchesProfile;
  });

  const filteredWorkingHours = workingHours.filter(wh => {
    const matchesSearch = wh.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesProfile = selectedProfileId === "all" || wh.profile_id === selectedProfileId;
    const matchesClient = selectedClientId === "all" || wh.client_id === selectedClientId;
    const matchesProject = selectedProjectId === "all" || wh.project_id === selectedProjectId;
    return matchesSearch && matchesProfile && matchesClient && matchesProject;
  });

  const filteredBankTransactions = bankTransactions.filter(transaction => {
    const matchesSearch = transaction.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesProfile = selectedProfileId === "all" || transaction.profile_id === selectedProfileId;
    return matchesSearch && matchesProfile;
  });

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = filteredWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
  const totalSalaryTransactions = filteredBankTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingPayrolls = filteredPayrolls.filter(p => p.status === 'pending').length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProfileId("all");
    setSelectedClientId("all");
    setSelectedProjectId("all");
  };

  const hasActiveFilters = searchTerm || selectedProfileId !== "all" || selectedClientId !== "all" || selectedProjectId !== "all";

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

        {/* Search and Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className={hasActiveFilters ? "bg-blue-50 border-blue-200" : ""}>
                <Filter className={`h-4 w-4 ${hasActiveFilters ? "text-blue-600" : ""}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white">
              <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-4 space-y-4">
                {/* Profile Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profile</label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Profiles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} - {profile.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
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

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
            payrolls={filteredPayrolls}
            profiles={profiles}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="payroll-generation">
          <PayrollGenerationWizard 
            profiles={profiles}
            workingHours={filteredWorkingHours}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="reports">
          <SalaryReports 
            payrolls={filteredPayrolls}
            workingHours={filteredWorkingHours}
            bankTransactions={filteredBankTransactions}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

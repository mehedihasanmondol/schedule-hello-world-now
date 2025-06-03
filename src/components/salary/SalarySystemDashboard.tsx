import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, DollarSign, Users, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, Profile, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollManagement } from "@/components/salary/PayrollManagement";

export const SalarySystemDashboard = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPayrolls(), fetchProfiles()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load salary system data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrolls = async () => {
    const { data, error } = await supabase
      .from("payroll")
      .select(`
        *,
        profiles!payroll_profile_id_fkey (id, full_name, role, hourly_rate),
        bank_accounts!payroll_bank_account_id_fkey (id, account_number, bank_name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const payrollData = (data || []).map((payroll) => ({
      ...payroll,
      profiles: Array.isArray(payroll.profiles)
        ? payroll.profiles[0]
        : payroll.profiles,
      bank_accounts: Array.isArray(payroll.bank_accounts)
        ? payroll.bank_accounts[0]
        : payroll.bank_accounts,
    }));

    setPayrolls(payrollData as Payroll[]);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("full_name");

    if (error) throw error;
    setProfiles(data as Profile[]);
  };

  if (loading && payrolls.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary System</h1>
            <p className="text-gray-600">Manage employee salaries and payroll</p>
          </div>
        </div>
        <Button onClick={fetchData}>Refresh Data</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payroll</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${payrolls.reduce((sum, p) => sum + p.gross_pay, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Employees</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{profiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payrolls</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter((p) => p.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <PayrollManagement payrolls={payrolls} profiles={profiles} onRefresh={fetchData} />

      <Card>
        <CardHeader>
          <CardTitle>Salary Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hourly Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Monthly Salary</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">YTD Earnings</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => {
                  const profilePayrolls = payrolls.filter(
                    (p) => p.profile_id === profile.id
                  );
                  const ytdEarnings = profilePayrolls.reduce(
                    (sum, p) => sum + p.net_pay,
                    0
                  );
                  const monthlySalary = profile.hourly_rate
                    ? profile.hourly_rate * 160
                    : profile.salary || 0;

                  return (
                    <tr
                      key={profile.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {profile.full_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {profile.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {profile.role}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        ${profile.hourly_rate?.toFixed(2) || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        ${monthlySalary.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-bold">
                        ${ytdEarnings.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

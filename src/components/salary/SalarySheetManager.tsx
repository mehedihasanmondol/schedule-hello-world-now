import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Download, Printer, Edit3, Trash2, Plus, FileText, DollarSign, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, Profile, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollDetailsDialog } from "@/components/salary/PayrollDetailsDialog";

export const SalarySheetManager = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrolls();
    fetchProfiles();
    fetchBankAccounts();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrolls(data as Payroll[]);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payrolls",
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

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*');

      if (error) throw error;
      setBankAccounts(data as BankAccount[]);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const handleViewDetails = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailsOpen(true);
  };

  const getProfileForPayroll = (payroll: Payroll): Profile | null => {
    return profiles.find(p => p.id === payroll.profile_id) || null;
  };

  const getBankAccountForPayroll = (payroll: Payroll): BankAccount | null => {
    return bankAccounts.find(b => b.id === payroll.bank_account_id) || null;
  };

  const getTotalGrossPay = () => {
    return payrolls.reduce((sum, payroll) => sum + payroll.gross_pay, 0);
  };

  const getTotalNetPay = () => {
    return payrolls.reduce((sum, payroll) => sum + payroll.net_pay, 0);
  };

  const getTotalDeductions = () => {
    return payrolls.reduce((sum, payroll) => sum + payroll.deductions, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Sheet Management</h1>
            <p className="text-gray-600">Manage and track employee payrolls efficiently</p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Payroll
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalGrossPay().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total gross salaries paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalNetPay().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total net salaries paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalDeductions().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total deductions across all payrolls</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Payrolls</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Employee</th>
                      <th className="text-left py-3 px-4 font-medium">Pay Period</th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      <th className="text-left py-3 px-4 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map((payroll) => {
                      const profile = getProfileForPayroll(payroll);
                      return (
                        <tr key={payroll.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                              <div className="text-sm text-gray-600">{profile?.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {new Date(payroll.pay_period_start).toLocaleDateString()} - 
                              {new Date(payroll.pay_period_end).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">{payroll.total_hours}</td>
                          <td className="py-3 px-4">${payroll.hourly_rate.toFixed(2)}</td>
                          <td className="py-3 px-4">${payroll.gross_pay.toFixed(2)}</td>
                          <td className="py-3 px-4">${payroll.net_pay.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              payroll.status === "paid" ? "default" : 
                              payroll.status === "approved" ? "secondary" : "outline"
                            }>
                              {payroll.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(payroll)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Employee</th>
                      <th className="text-left py-3 px-4 font-medium">Pay Period</th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      <th className="text-left py-3 px-4 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls
                      .filter(payroll => payroll.status === 'pending')
                      .map((payroll) => {
                        const profile = getProfileForPayroll(payroll);
                        return (
                          <tr key={payroll.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-gray-600">{profile?.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                {new Date(payroll.pay_period_start).toLocaleDateString()} - 
                                {new Date(payroll.pay_period_end).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">{payroll.total_hours}</td>
                            <td className="py-3 px-4">${payroll.hourly_rate.toFixed(2)}</td>
                            <td className="py-3 px-4">${payroll.gross_pay.toFixed(2)}</td>
                            <td className="py-3 px-4">${payroll.net_pay.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{payroll.status}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(payroll)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Employee</th>
                      <th className="text-left py-3 px-4 font-medium">Pay Period</th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      <th className="text-left py-3 px-4 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls
                      .filter(payroll => payroll.status === 'approved')
                      .map((payroll) => {
                        const profile = getProfileForPayroll(payroll);
                        return (
                          <tr key={payroll.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-gray-600">{profile?.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                {new Date(payroll.pay_period_start).toLocaleDateString()} - 
                                {new Date(payroll.pay_period_end).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">{payroll.total_hours}</td>
                            <td className="py-3 px-4">${payroll.hourly_rate.toFixed(2)}</td>
                            <td className="py-3 px-4">${payroll.gross_pay.toFixed(2)}</td>
                            <td className="py-3 px-4">${payroll.net_pay.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{payroll.status}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(payroll)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="paid" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Employee</th>
                      <th className="text-left py-3 px-4 font-medium">Pay Period</th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      <th className="text-left py-3 px-4 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls
                      .filter(payroll => payroll.status === 'paid')
                      .map((payroll) => {
                        const profile = getProfileForPayroll(payroll);
                        return (
                          <tr key={payroll.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-gray-600">{profile?.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                {new Date(payroll.pay_period_start).toLocaleDateString()} - 
                                {new Date(payroll.pay_period_end).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">{payroll.total_hours}</td>
                            <td className="py-3 px-4">${payroll.hourly_rate.toFixed(2)}</td>
                            <td className="py-3 px-4">${payroll.gross_pay.toFixed(2)}</td>
                            <td className="py-3 px-4">${payroll.net_pay.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <Badge>{payroll.status}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(payroll)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PayrollDetailsDialog
        payroll={selectedPayroll}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        profile={selectedPayroll ? getProfileForPayroll(selectedPayroll) : null}
        bankAccount={selectedPayroll ? getBankAccountForPayroll(selectedPayroll) : null}
      />
    </div>
  );
};

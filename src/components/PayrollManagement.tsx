
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, DollarSign, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PayrollRecord {
  id: string;
  profile_id: string;
  pay_period_start: string;
  pay_period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const PayrollManagement = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrollRecords();
  }, []);

  const fetchPayrollRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('pay_period_start', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data as PayrollRecord[]);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payrollId: string) => {
    // This would open an edit form - implementing basic structure
    toast({
      title: "Edit Payroll",
      description: "Edit functionality to be implemented",
    });
  };

  const handleDelete = async (payrollId: string) => {
    if (!confirm("Are you sure you want to delete this payroll record?")) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', payrollId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll record deleted successfully",
      });

      fetchPayrollRecords();
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      toast({
        title: "Error",
        description: "Failed to delete payroll record",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">Manage employee payroll records</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{payrollRecords.length}</div>
            <p className="text-xs text-muted-foreground">All payroll entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payrollRecords.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${payrollRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.net_pay, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total payments made</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records ({payrollRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {record.profiles?.full_name || 'Unknown Employee'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="text-sm">
                        {formatDate(record.pay_period_start)} - {formatDate(record.pay_period_end)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="font-medium">{record.total_hours}h</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ${record.hourly_rate.toFixed(2)}/hr
                    </td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      ${record.gross_pay.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-red-600">
                      ${record.deductions.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-600">
                      ${record.net_pay.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(record.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(record.id)}
                        >
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

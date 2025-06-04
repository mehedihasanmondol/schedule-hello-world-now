import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Payroll } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollDetailsDialog } from "./PayrollDetailsDialog";
import { FileText, Download, Printer } from "lucide-react";

interface PayrollWithProfile extends Omit<Payroll, 'profiles'> {
  profiles: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface SalarySheetManagerProps {
  payrolls: Payroll[];
  profiles: any[];
  onRefresh: () => Promise<void>;
}

export const SalarySheetManager = ({ payrolls, profiles, onRefresh }: SalarySheetManagerProps) => {
  const [payrollData, setPayrollData] = useState<PayrollWithProfile[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrollDetails();
  }, [payrolls]);

  const fetchPayrollDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          profiles!payroll_profile_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPayrollData((data || []) as PayrollWithProfile[]);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (payroll: PayrollWithProfile) => {
    // Implementation for downloading salary sheet
    toast({ title: "Download", description: "Downloading salary sheet..." });
  };

  const handlePrint = (payroll: PayrollWithProfile) => {
    // Implementation for printing salary sheet
    toast({ title: "Print", description: "Printing salary sheet..." });
  };

  const handleViewDetails = (payroll: PayrollWithProfile) => {
    setSelectedPayroll(payroll as Payroll);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Salary Sheets</h2>
        <Button onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {payrollData.map((payroll) => (
          <Card key={payroll.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {payroll.profiles?.full_name || 'Unknown Employee'}
                </CardTitle>
                <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                  {payroll.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Pay Period</p>
                  <p className="font-medium">
                    {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="font-medium">{payroll.total_hours}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gross Pay</p>
                  <p className="font-medium text-green-600">${payroll.gross_pay}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Pay</p>
                  <p className="font-medium text-blue-600">${payroll.net_pay}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(payroll)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(payroll)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePrint(payroll)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PayrollDetailsDialog
        payroll={selectedPayroll}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPayroll(null);
        }}
        onRefresh={onRefresh}
      />
    </div>
  );
};

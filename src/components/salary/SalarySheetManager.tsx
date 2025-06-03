
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, Download, Plus } from "lucide-react";
import { Payroll, Profile } from "@/types/database";
import { SalarySheetPrintView } from "./SalarySheetPrintView";

interface SalarySheetManagerProps {
  payrolls: Payroll[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const SalarySheetManager = ({ payrolls, profiles, onRefresh }: SalarySheetManagerProps) => {
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsPreviewOpen(true);
  };

  const handleDownload = (payroll: Payroll) => {
    // This would trigger a download of the salary sheet
    console.log('Download salary sheet for:', payroll.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Sheets</h2>
          <p className="text-gray-600">Manage and view salary sheets for all employees</p>
        </div>
        <Button onClick={onRefresh}>
          <Plus className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payrolls.map((payroll) => {
          const profile = profiles.find(p => p.id === payroll.profile_id);
          
          return (
            <Card key={payroll.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{profile?.full_name || 'Unknown'}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {new Date(payroll.pay_period_start).toLocaleDateString()} - 
                      {new Date(payroll.pay_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                    {payroll.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">{payroll.total_hours}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gross Pay:</span>
                    <span className="font-medium">${payroll.gross_pay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Net Pay:</span>
                    <span className="font-bold text-green-600">${payroll.net_pay.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(payroll)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(payroll)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {payrolls.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Sheets</h3>
          <p className="text-gray-600">No salary sheets have been generated yet.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Sheet Preview</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <SalarySheetPrintView
              payroll={selectedPayroll}
              profile={profiles.find(p => p.id === selectedPayroll.profile_id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

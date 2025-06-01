
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTime: string | null;
}

const BookingModal = ({ isOpen, onClose, selectedTime }: BookingModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    notes: ""
  });

  const services = [
    "Consultation (30 min)",
    "Strategy Session (60 min)",
    "Follow-up Meeting (30 min)",
    "Workshop (90 min)"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Appointment booked successfully! You'll receive a confirmation email shortly.");
    onClose();
    setFormData({ name: "", email: "", phone: "", service: "", notes: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-blue-600" />
            Book Appointment
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Selected Time: {selectedTime}</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">December 15, 2024</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="service">Service *</Label>
            <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any special requirements or notes..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Book Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;

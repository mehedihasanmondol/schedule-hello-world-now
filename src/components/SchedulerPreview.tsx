
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import BookingModal from "@/components/BookingModal";

const SchedulerPreview = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
  ];

  const upcomingAppointments = [
    {
      time: "10:00 AM",
      client: "Sarah Johnson",
      service: "Consultation",
      duration: "30 min"
    },
    {
      time: "2:30 PM",
      client: "Mike Chen",
      service: "Strategy Session",
      duration: "60 min"
    },
    {
      time: "4:00 PM",
      client: "Emma Davis",
      service: "Follow-up",
      duration: "30 min"
    }
  ];

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
    setIsModalOpen(true);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See it in action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience how easy it is for your clients to book appointments with our intuitive interface.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Time Slots */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Available Time Slots
              </CardTitle>
              <p className="text-blue-100">Today, December 15, 2024</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    className="h-12 text-left justify-start hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                    onClick={() => handleTimeSlotClick(time)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {time}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <p className="text-purple-100">3 appointments scheduled</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {appointment.time}
                        </Badge>
                        <span className="font-medium text-gray-900">{appointment.client}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {appointment.service} • {appointment.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
            Start Your Free Trial
          </Button>
        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedTime={selectedTime} 
      />
    </section>
  );
};

export default SchedulerPreview;

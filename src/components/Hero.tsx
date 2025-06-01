
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Online Scheduler
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your appointment booking process with our intuitive online scheduling platform. 
            Let clients book appointments 24/7 while you focus on what matters most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-2">
              Watch Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Smart Calendar Integration</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Clock className="h-6 w-6 text-purple-600" />
              <span className="font-medium">24/7 Booking Availability</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Client Management</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

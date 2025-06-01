
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Bell, Shield, Zap, Globe } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Calendar Sync",
      description: "Seamlessly integrate with Google Calendar, Outlook, and other popular calendar applications."
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Set custom availability, buffer times, and recurring appointments with ease."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Automated email and SMS reminders reduce no-shows and keep everyone informed."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security ensures your data and your clients' information stays protected."
    },
    {
      icon: Zap,
      title: "Instant Booking",
      description: "Clients can book appointments instantly without back-and-forth emails or phone calls."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Works across time zones with automatic timezone detection and conversion."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to manage appointments
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make scheduling effortless for you and your clients.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

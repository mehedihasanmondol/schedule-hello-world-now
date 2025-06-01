
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SchedulerPreview from "@/components/SchedulerPreview";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Hero />
      <Features />
      <SchedulerPreview />
    </div>
  );
};

export default Index;

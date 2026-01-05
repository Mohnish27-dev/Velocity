import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Sparkles, 
  Briefcase, 
  BarChart3, 
  Bell, 
  Users,
  FileText,
  Zap
} from "lucide-react";
import Globe from "./Globe";

function SkeletonOne() {
  return (
    <div className="relative flex py-8 px-2 gap-10 h-full">
      <div className="w-full p-5 mx-auto bg-neutral-900 shadow-2xl group h-full rounded-xl border border-neutral-800">
        <div className="flex flex-1 w-full h-full flex-col space-y-2">
          {/* Resume preview mockup */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-700 rounded w-32" />
                <div className="h-3 bg-neutral-800 rounded w-24" />
              </div>
              <div className="flex gap-1">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-indigo-400 font-medium">AI Enhanced</span>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-neutral-800">
              <div className="h-3 bg-neutral-700 rounded w-full" />
              <div className="h-3 bg-neutral-800 rounded w-5/6" />
              <div className="h-3 bg-neutral-800 rounded w-4/6" />
            </div>
            <div className="flex gap-2 pt-2">
              <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">React</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">TypeScript</span>
              <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">Node.js</span>
            </div>
            <div className="space-y-2 pt-4 border-t border-neutral-800">
              <div className="h-3 bg-neutral-700 rounded w-full" />
              <div className="h-3 bg-neutral-800 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 z-40 inset-x-0 h-60 bg-gradient-to-t from-black via-black to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-60 bg-gradient-to-b from-black via-transparent to-transparent w-full pointer-events-none" />
    </div>
  );
}

function SkeletonTwo() {
  const jobs = [
    { title: "Senior Frontend Dev", company: "Google", match: 95 },
    { title: "Full Stack Engineer", company: "Meta", match: 92 },
    { title: "React Developer", company: "Stripe", match: 89 },
    { title: "Software Engineer", company: "Vercel", match: 87 },
    { title: "UI Engineer", company: "Linear", match: 85 },
  ];

  return (
    <div className="relative flex flex-col items-start p-4 gap-2 h-full overflow-hidden">
      {jobs.map((job, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
          className="w-full p-3 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">{job.title}</p>
              <p className="text-xs text-neutral-500">{job.company}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-400">{job.match}%</span>
            </div>
          </div>
        </motion.div>
      ))}
      <div className="absolute left-0 z-[100] inset-y-0 w-10 bg-gradient-to-r from-black to-transparent h-full pointer-events-none" />
      <div className="absolute right-0 z-[100] inset-y-0 w-10 bg-gradient-to-l from-black to-transparent h-full pointer-events-none" />
      <div className="absolute bottom-0 z-[100] inset-x-0 h-20 bg-gradient-to-t from-black to-transparent w-full pointer-events-none" />
    </div>
  );
}

function SkeletonThree() {
  const alerts = [
    { type: "new", message: "5 new Frontend jobs in San Francisco", time: "2m ago" },
    { type: "match", message: "Perfect match: Senior React Dev at Stripe", time: "15m ago" },
    { type: "update", message: "Your saved job updated requirements", time: "1h ago" },
  ];

  return (
    <div className="relative flex flex-col gap-3 p-4 h-full">
      {alerts.map((alert, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.15 }}
          className="flex items-start gap-3 p-3 bg-neutral-900 rounded-lg border border-neutral-800"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            alert.type === "new" && "bg-blue-500/20",
            alert.type === "match" && "bg-green-500/20",
            alert.type === "update" && "bg-yellow-500/20"
          )}>
            <Bell className={cn(
              "w-4 h-4",
              alert.type === "new" && "text-blue-400",
              alert.type === "match" && "text-green-400",
              alert.type === "update" && "text-yellow-400"
            )} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white">{alert.message}</p>
            <p className="text-xs text-neutral-500">{alert.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SkeletonFour() {
  return (
    <div className="h-60 md:h-60 flex flex-col items-center relative bg-transparent mt-10">
      <Globe className="absolute -right-10 md:-right-10 -bottom-80 md:-bottom-72" />
    </div>
  );
}

const features = [
  {
    title: "AI-Powered Resume Enhancement",
    description:
      "Transform your resume with cutting-edge AI. Get ATS-optimized formatting, keyword suggestions, and industry-specific improvements.",
    skeleton: <SkeletonOne />,
    className: "col-span-1 lg:col-span-4 border-b lg:border-r border-neutral-800",
  },
  {
    title: "Smart Job Matching",
    description:
      "Find opportunities that truly match your skills. Our AI analyzes thousands of listings to surface your perfect roles.",
    skeleton: <SkeletonTwo />,
    className: "border-b col-span-1 lg:col-span-2 border-neutral-800",
  },
  {
    title: "Real-time Job Alerts",
    description:
      "Never miss an opportunity. Get instant notifications when jobs matching your criteria are posted.",
    skeleton: <SkeletonThree />,
    className: "col-span-1 lg:col-span-3 lg:border-r border-neutral-800",
  },
  {
    title: "Global Opportunities",
    description:
      "Access job markets worldwide. Whether remote or on-site, find opportunities across continents.",
    skeleton: <SkeletonFour />,
    className: "col-span-1 lg:col-span-3 border-b lg:border-none border-neutral-800",
  },
];

export default function FeaturesSection() {
  return (
    <div className="relative z-20 py-20 lg:py-32 max-w-7xl mx-auto">
      <div className="px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-white"
        >
          Everything you need to{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            accelerate
          </span>{" "}
          your career
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-neutral-400 text-center font-normal"
        >
          From AI resume optimization to global job search, Velocity provides
          the tools you need to land your dream job faster.
        </motion.p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 border rounded-xl border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} className={feature.className} index={index}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ children, className, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={cn("p-4 sm:p-8 relative overflow-hidden", className)}
    >
      {children}
    </motion.div>
  );
}

function FeatureTitle({ children }) {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-white text-xl md:text-2xl md:leading-snug font-medium">
      {children}
    </p>
  );
}

function FeatureDescription({ children }) {
  return (
    <p className="text-sm md:text-base max-w-4xl text-left mx-auto text-neutral-400 font-normal max-w-sm mx-0 md:text-sm my-2">
      {children}
    </p>
  );
}

// Additional Features Grid Component
export function AdditionalFeatures() {
  const additionalFeatures = [
    {
      icon: Search,
      title: "Advanced Search",
      description: "Filter by salary, location, company size, and more",
    },
    {
      icon: Briefcase,
      title: "Application Tracking",
      description: "Track every application status in one dashboard",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Visualize your job search progress and patterns",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with other job seekers and share tips",
    },
    {
      icon: FileText,
      title: "Multiple Resumes",
      description: "Create role-specific resume versions",
    },
    {
      icon: Zap,
      title: "Quick Apply",
      description: "Apply to multiple jobs with one click",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
      {additionalFeatures.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="group relative p-6 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-neutral-700 transition-colors">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-400">{feature.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

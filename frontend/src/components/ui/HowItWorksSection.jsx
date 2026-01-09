import { motion } from "framer-motion";
import { FileText, Sparkles, Target, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Upload Your Resume",
    description:
      "Start by uploading your existing resume. Our AI will analyze your experience, skills, and achievements to understand your profile.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "AI Enhancement",
    description:
      "Get intelligent suggestions to optimize your resume. Improve ATS compatibility, enhance keywords, and highlight your best achievements.",
  },
  {
    step: "03",
    icon: Target,
    title: "Match & Apply",
    description:
      "Discover perfectly matched opportunities and apply with your optimized resume. Track every application in your personalized dashboard.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How{" "}
            <span className="text-sky-400">
              Velocity
            </span>{" "}
            works
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Three simple steps to accelerate your job search and land your dream role
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Lines */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step Number */}
                <div className="text-7xl font-bold text-zinc-900 mb-4 select-none">
                  {item.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-sky-500/20 rounded-2xl blur-xl opacity-30" />
                  <div className="relative w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-sky-400" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.description}
                </p>

                {/* Arrow (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/3 -right-4 transform translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-zinc-700" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

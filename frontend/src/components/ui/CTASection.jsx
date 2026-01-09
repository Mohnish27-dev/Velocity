import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background Effects - Minimal */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-sky-900/10 via-transparent to-transparent" />

      {/* Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm mb-8">
            <Zap className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-zinc-300">Ready to accelerate?</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Start your journey to{" "}
            <span className="text-sky-400">
              career success
            </span>
          </h2>

          <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their job search with Velocity. 
            Free to start, powerful to scale.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-900 hover:border-zinc-600 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          <p className="text-sm text-zinc-500 mt-6">
            No credit card required • Free forever plan available
          </p>
        </motion.div>
      </div>
    </section>
  );
}

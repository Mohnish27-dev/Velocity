import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    content:
      "Velocity's AI resume enhancement is incredible. It helped me tailor my resume perfectly for each application. Landed my dream job in 3 weeks!",
    avatar: "SC",
  },
  {
    name: "Michael Rodriguez",
    role: "Product Manager at Meta",
    content:
      "The job tracking feature kept me organized throughout my search. The AI suggestions were spot-on. Highly recommend to any serious job seeker.",
    avatar: "MR",
  },
  {
    name: "Emily Johnson",
    role: "UX Designer at Apple",
    content:
      "Finally, a platform that understands what job seekers actually need. Simple, powerful, and the dark mode is gorgeous!",
    avatar: "EJ",
  },
  {
    name: "David Kim",
    role: "Data Scientist at Netflix",
    content:
      "The AI matching is scary accurate. Found positions I never would have discovered on my own. Game changer for my career.",
    avatar: "DK",
  },
  {
    name: "Lisa Thompson",
    role: "Engineering Lead at Stripe",
    content:
      "Used Velocity to transition from startup to big tech. The resume analyzer helped me highlight the right achievements.",
    avatar: "LT",
  },
  {
    name: "James Wilson",
    role: "Frontend Dev at Vercel",
    content:
      "Clean interface, powerful features. The job alerts kept me updated on perfect matches. Worth every minute spent.",
    avatar: "JW",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              thousands
            </span>{" "}
            of job seekers
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Join the community of professionals who accelerated their careers with Velocity
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-6 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              
              <div className="relative">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                
                <p className="text-neutral-300 mb-6 leading-relaxed text-sm">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { TestimonialsColumn } from "./testimonials-columns";

const testimonials = [
  {
    text: "careerpilot's AI resume enhancement is incredible. It helped me tailor my resume perfectly for each application. Landed my dream job in 3 weeks!",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Sarah Chen",
    role: "Software Engineer at Google",
  },
  {
    text: "The job tracking feature kept me organized throughout my search. The AI suggestions were spot-on. Highly recommend to any serious job seeker.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Michael Rodriguez",
    role: "Product Manager at Meta",
  },
  {
    text: "Finally, a platform that understands what job seekers actually need. Simple, powerful, and the dark mode is gorgeous!",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Emily Johnson",
    role: "UX Designer at Apple",
  },
  {
    text: "The AI matching is incredibly accurate. Found positions I never would have discovered on my own. Complete game changer for my career.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David Kim",
    role: "Data Scientist at Netflix",
  },
  {
    text: "Used careerpilot to transition from startup to big tech. The resume analyzer helped me highlight the right achievements.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Lisa Thompson",
    role: "Engineering Lead at Stripe",
  },
  {
    text: "Clean interface, powerful features. The job alerts kept me updated on perfect matches. Worth every minute spent on this platform.",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    name: "James Wilson",
    role: "Frontend Dev at Vercel",
  },
  {
    text: "The mock interview feature gave me the confidence I needed. Practiced system design questions and aced my final round.",
    image: "https://randomuser.me/api/portraits/women/7.jpg",
    name: "Amanda Foster",
    role: "Backend Engineer at Spotify",
  },
  {
    text: "Fellowship challenges helped me build real portfolio projects while earning. The community support is unmatched.",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    name: "Ryan Martinez",
    role: "Full Stack Dev at Airbnb",
  },
  {
    text: "From application to offer in just 2 weeks. careerpilot streamlined my entire job search process beautifully.",
    image: "https://randomuser.me/api/portraits/women/9.jpg",
    name: "Jessica Lee",
    role: "ML Engineer at OpenAI",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-zinc-700 py-1 px-4 rounded-lg text-zinc-400 text-sm">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mt-5 text-center text-white">
            Loved by{" "}
            <span className="text-sky-400">thousands</span>{" "}
            of job seekers
          </h2>
          <p className="text-center mt-5 text-zinc-400 max-w-md">
            Join the community of professionals who accelerated their careers with careerpilot
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}
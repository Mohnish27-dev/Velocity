import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  FileText,
  Briefcase,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  Send,
  Star,
  MessageSquare,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Users,
  Sparkles,
  GraduationCap
} from 'lucide-react'
import { resumeApi, jobTrackerApi } from '../services/api'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

const STATUS_CONFIG = {
  saved: { label: 'Saved', color: 'bg-zinc-800 text-zinc-300 border border-zinc-700', icon: Star },
  applied: { label: 'Applied', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20', icon: Send },
  interviewing: { label: 'Interviewing', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: MessageSquare },
  offered: { label: 'Offered', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: CheckCircle2 }
}

export default function Dashboard() {
  const [resumes, setResumes] = useState([])
  const [trackedJobs, setTrackedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobStats, setJobStats] = useState({
    total: 0,
    saved: 0,
    applied: 0,
    interviewing: 0,
    offered: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [resumeRes, jobsRes] = await Promise.all([
        resumeApi.getAll().catch(() => ({ resumes: [] })),
        jobTrackerApi.getAll().catch(() => ({ trackedJobs: [] }))
      ])

      setResumes(resumeRes.resumes || resumeRes.data?.resumes || [])
      const jobs = jobsRes.trackedJobs || []
      setTrackedJobs(jobs)

      const stats = {
        total: jobs.length,
        saved: jobs.filter(j => j.status === 'saved').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        offered: jobs.filter(j => j.status === 'offered').length
      }
      setJobStats(stats)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Background Effects - Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-zinc-400 text-sm">Command Center Active</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-zinc-400">Track your applications, enhance resumes, and land your dream job.</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-zinc-800 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-2 border-transparent border-t-sky-500 rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Quick Actions - Clean minimal cards */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-4 mb-8">
              <Link to="/jobs" className="group">
                <div className="relative p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900">
                  <div className="relative">
                    <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Find Jobs</h3>
                    <p className="text-zinc-500 text-sm">Search opportunities</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
                </div>
              </Link>

              <Link to="/job-tracker" className="group">
                <div className="relative p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900">
                  <div className="relative">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Briefcase className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Job Tracker</h3>
                    <p className="text-zinc-500 text-sm">{jobStats.total} tracked</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
                </div>
              </Link>

              <Link to="/upload" className="group">
                <div className="relative p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900">
                  <div className="relative">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">AI Enhance</h3>
                    <p className="text-zinc-500 text-sm">Optimize resume</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
                </div>
              </Link>

              <Link to="/community" className="group">
                <div className="relative p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900">
                  <div className="relative">
                    <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Community</h3>
                    <p className="text-zinc-500 text-sm">Connect & share</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
                </div>
              </Link>

              <Link to="/fellowship" className="group">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-zinc-900 border border-emerald-900/50 overflow-hidden transition-all duration-300 hover:border-emerald-700/50 hover:shadow-lg hover:shadow-emerald-900/20">
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/20 rounded text-[10px] text-emerald-400 font-medium">NEW</div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-4">
                      <GraduationCap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Fellowships</h3>
                    <p className="text-zinc-500 text-sm">Earn while learning</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-emerald-600 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                </div>
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { icon: Star, value: jobStats.saved, label: 'Saved', color: 'text-zinc-400', bg: 'bg-zinc-800/50' },
                { icon: Send, value: jobStats.applied, label: 'Applied', color: 'text-sky-400', bg: 'bg-sky-500/10' },
                { icon: MessageSquare, value: jobStats.interviewing, label: 'Interviewing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { icon: CheckCircle2, value: jobStats.offered, label: 'Offers', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: FileText, value: resumes.length, label: 'Resumes', color: 'text-sky-400', bg: 'bg-sky-500/10' }
              ].map((stat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center hover:border-zinc-700 transition-colors">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Applications */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-zinc-500" />
                    Recent Applications
                  </h2>
                  <Link to="/job-tracker" className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {trackedJobs.length === 0 ? (
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 text-center py-12">
                    <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="font-medium text-white mb-2">No applications yet</h3>
                    <p className="text-zinc-500 text-sm mb-4">Start searching for jobs to track your applications</p>
                    <Link to="/jobs">
                      <Button variant="primary" className="text-sm">Search Jobs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                    <div className="divide-y divide-zinc-800">
                      {trackedJobs.slice(0, 5).map((job, index) => {
                        const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.saved
                        const StatusIcon = statusConfig.icon
                        return (
                          <div key={job.id || index} className="p-4 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-white">{job.title}</h4>
                                <p className="text-sm text-zinc-500">{job.company}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* My Resumes */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-500" />
                    My Resumes
                  </h2>
                  <Link to="/upload" className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-1 transition-colors">
                    Upload new <Plus className="w-4 h-4" />
                  </Link>
                </div>

                {resumes.length === 0 ? (
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 text-center py-12">
                    <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="font-medium text-white mb-2">No resumes yet</h3>
                    <p className="text-zinc-500 text-sm mb-4">Upload your resume to get AI-powered enhancements</p>
                    <Link to="/upload">
                      <Button variant="primary" className="text-sm">Upload Resume</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                    <div className="divide-y divide-zinc-800">
                      {resumes.slice(0, 5).map(resume => (
                        <div key={resume.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{resume.title}</h4>
                                {resume.enhancedText && (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">Enhanced</span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-500">{resume.jobRole || 'General'} • {formatDate(resume.createdAt)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link to={`/resume/${resume.id}`}>
                                <Button variant="ghost" className="!py-1.5 !px-3 text-xs">View</Button>
                              </Link>
                              <Link to={`/enhance/${resume.id}`}>
                                <Button variant="primary" className="!py-1.5 !px-3 text-xs">Enhance</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Tips Section */}
            <motion.div variants={itemVariants} className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Pro Tips
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Optimize Your Resume</h3>
                  <p className="text-sm text-zinc-400">Use our AI to tailor your resume for each job application</p>
                </div>
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Track Everything</h3>
                  <p className="text-sm text-zinc-400">Keep notes and update statuses to stay organized in your job hunt</p>
                </div>
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-sky-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Follow Up</h3>
                  <p className="text-sm text-zinc-400">Don't forget to follow up on applications after a week</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

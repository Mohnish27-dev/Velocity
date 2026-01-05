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
  Sparkles
} from 'lucide-react'
import { resumeApi, jobTrackerApi } from '../services/api'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

const STATUS_CONFIG = {
  saved: { label: 'Saved', color: 'bg-neutral-800 text-neutral-300 border border-neutral-700', icon: Star },
  applied: { label: 'Applied', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: Send },
  interviewing: { label: 'Interviewing', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30', icon: MessageSquare },
  offered: { label: 'Offered', color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: CheckCircle2 }
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
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-neutral-400 text-sm">Command Center Active</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-neutral-400">Track your applications, enhance resumes, and land your dream job.</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-neutral-800 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-4 mb-8">
              <Link to="/jobs" className="group">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Find Jobs</h3>
                    <p className="text-indigo-200 text-sm">Search opportunities</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </Link>

              <Link to="/job-tracker" className="group">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Job Tracker</h3>
                    <p className="text-emerald-200 text-sm">{jobStats.total} tracked</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </Link>

              <Link to="/upload" className="group">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-orange-600 to-pink-600 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">AI Enhance</h3>
                    <p className="text-orange-200 text-sm">Optimize resume</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </Link>

              <Link to="/community" className="group">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Community</h3>
                    <p className="text-violet-200 text-sm">Connect & share</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { icon: Star, value: jobStats.saved, label: 'Saved', color: 'text-neutral-400', bg: 'bg-neutral-800' },
                { icon: Send, value: jobStats.applied, label: 'Applied', color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { icon: MessageSquare, value: jobStats.interviewing, label: 'Interviewing', color: 'text-purple-400', bg: 'bg-purple-500/20' },
                { icon: CheckCircle2, value: jobStats.offered, label: 'Offers', color: 'text-green-400', bg: 'bg-green-500/20' },
                { icon: FileText, value: resumes.length, label: 'Resumes', color: 'text-indigo-400', bg: 'bg-indigo-500/20' }
              ].map((stat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center hover:border-neutral-700 transition-colors">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Applications */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-neutral-500" />
                    Recent Applications
                  </h2>
                  <Link to="/job-tracker" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {trackedJobs.length === 0 ? (
                  <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 text-center py-12">
                    <Briefcase className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                    <h3 className="font-medium text-white mb-2">No applications yet</h3>
                    <p className="text-neutral-500 text-sm mb-4">Start searching for jobs to track your applications</p>
                    <Link to="/jobs">
                      <Button variant="primary" className="text-sm">Search Jobs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 overflow-hidden">
                    <div className="divide-y divide-neutral-800">
                      {trackedJobs.slice(0, 5).map((job, index) => {
                        const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.saved
                        const StatusIcon = statusConfig.icon
                        return (
                          <div key={job.id || index} className="p-4 hover:bg-neutral-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-white">{job.title}</h4>
                                <p className="text-sm text-neutral-500">{job.company}</p>
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
                    <FileText className="w-5 h-5 text-neutral-500" />
                    My Resumes
                  </h2>
                  <Link to="/upload" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors">
                    Upload new <Plus className="w-4 h-4" />
                  </Link>
                </div>
                
                {resumes.length === 0 ? (
                  <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 text-center py-12">
                    <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                    <h3 className="font-medium text-white mb-2">No resumes yet</h3>
                    <p className="text-neutral-500 text-sm mb-4">Upload your resume to get AI-powered enhancements</p>
                    <Link to="/upload">
                      <Button variant="primary" className="text-sm">Upload Resume</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 overflow-hidden">
                    <div className="divide-y divide-neutral-800">
                      {resumes.slice(0, 5).map(resume => (
                        <div key={resume.id} className="p-4 hover:bg-neutral-800/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{resume.title}</h4>
                                {resume.enhancedText && (
                                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">Enhanced</span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-500">{resume.jobRole || 'General'} • {formatDate(resume.createdAt)}</p>
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
                <Zap className="w-5 h-5 text-yellow-500" />
                Pro Tips
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-yellow-500/30 transition-all group">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Optimize Your Resume</h3>
                  <p className="text-sm text-neutral-400">Use our AI to tailor your resume for each job application</p>
                </div>
                <div className="p-5 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-green-500/30 transition-all group">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Track Everything</h3>
                  <p className="text-sm text-neutral-400">Keep notes and update statuses to stay organized in your job hunt</p>
                </div>
                <div className="p-5 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-purple-500/30 transition-all group">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Follow Up</h3>
                  <p className="text-sm text-neutral-400">Don't forget to follow up on applications after a week</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

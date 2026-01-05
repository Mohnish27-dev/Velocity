import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { resumeApi } from '../services/api'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Card from '../components/Card'

export default function ResumeView() {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState('enhanced') // 'original' or 'enhanced'

  useEffect(() => {
    fetchResume()
  }, [resumeId])

  const fetchResume = async () => {
    try {
      const response = await resumeApi.getById(resumeId)
      setResume(response.data)
      
      // Set default tab based on available content
      if (!response.data.enhancedText) {
        setActiveTab('original')
      }
    } catch (error) {
      toast.error('Failed to load resume')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true)
      const blob = await resumeApi.downloadPdf(resumeId, activeTab)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resume?.title || 'resume'}_${activeTab}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-neutral-400">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading resume...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{resume?.title}</h1>
            <p className="text-neutral-400">
              {resume?.jobRole && `Target: ${resume.jobRole}`}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Last modified: {formatDate(resume?.lastModified || resume?.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/enhance/${resumeId}`}>
              <Button variant="primary">
                {resume?.enhancedText ? 'Re-enhance' : 'Enhance'}
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-800 mb-6">
          <nav className="flex gap-8">
            {resume?.enhancedText && (
              <button
                onClick={() => setActiveTab('enhanced')}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'enhanced'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Enhanced Version
              </button>
            )}
            <button
              onClick={() => setActiveTab('original')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'original'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Original Version
            </button>
          </nav>
        </div>

        {/* Content */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-medium text-white">
              {activeTab === 'enhanced' ? 'AI-Enhanced Resume' : 'Original Resume'}
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="primary"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleCopy(
                  activeTab === 'enhanced' 
                    ? resume?.enhancedText 
                    : resume?.originalText
                )}
              >
                Copy to Clipboard
              </Button>
            </div>
          </div>
          
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 min-h-96 overflow-auto">
            {activeTab === 'enhanced' && resume?.enhancedText ? (
              <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300 prose-strong:text-white prose-li:text-neutral-300">
                <ReactMarkdown>{resume.enhancedText}</ReactMarkdown>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-neutral-300 font-mono">
                {resume?.originalText}
              </pre>
            )}
          </div>
        </Card>

        {/* Metadata */}
        {resume?.preferences && Object.keys(resume.preferences).length > 0 && (
          <Card className="mt-6">
            <h3 className="text-lg font-medium text-white mb-4">Enhancement Settings Used</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {resume.jobRole && (
                <div>
                  <span className="text-neutral-500">Target Role:</span>
                  <span className="ml-2 text-neutral-300">{resume.jobRole}</span>
                </div>
              )}
              {resume.preferences.yearsOfExperience && (
                <div>
                  <span className="text-neutral-500">Experience:</span>
                  <span className="ml-2 text-neutral-300">
                    {resume.preferences.yearsOfExperience} years
                  </span>
                </div>
              )}
              {resume.preferences.skills?.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-neutral-500">Skills:</span>
                  <span className="ml-2 text-neutral-300">
                    {resume.preferences.skills.join(', ')}
                  </span>
                </div>
              )}
              {resume.preferences.industry && (
                <div>
                  <span className="text-neutral-500">Industry:</span>
                  <span className="ml-2 text-neutral-300">{resume.preferences.industry}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

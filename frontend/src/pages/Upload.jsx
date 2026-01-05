import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { uploadApi, resumeApi } from '../services/api'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'
import FileUpload from '../components/FileUpload'
import { FileText, Upload as UploadIcon, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react'

export default function Upload() {
  const navigate = useNavigate()
  
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: upload, 2: review

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile)
    setLoading(true)
    
    try {
      const response = await uploadApi.uploadPdf(selectedFile)
      setExtractedText(response.data.extractedText)
      setTitle(`Resume - ${new Date().toLocaleDateString()}`)
      setStep(2)
      toast.success('Text extracted successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to extract text from PDF')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!extractedText.trim()) {
      toast.error('No content to save')
      return
    }

    setLoading(true)
    try {
      const response = await resumeApi.create({
        originalText: extractedText,
        title: title || 'Untitled Resume'
      })
      
      toast.success('Resume saved!')
      navigate(`/enhance/${response.data.id}`)
    } catch (error) {
      toast.error(error.message || 'Failed to save resume')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep(1)
    setFile(null)
    setExtractedText('')
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-4">
            <UploadIcon className="w-4 h-4" />
            AI-Powered Resume Enhancement
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Upload Resume</h1>
          <p className="text-neutral-400">
            Upload your PDF resume to extract text and enhance it with AI
          </p>
        </motion.div>

        {/* Steps Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-neutral-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-indigo-500' : 'bg-neutral-800'
            }`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className={`flex-1 h-px ${step > 1 ? 'bg-indigo-500' : 'bg-neutral-800'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-neutral-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-indigo-500' : 'bg-neutral-800'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Review & Save</span>
          </div>
        </motion.div>

        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Select PDF File</h2>
                <p className="text-sm text-neutral-500">We'll extract the text from your resume</p>
              </div>
            </div>
            <FileUpload 
              onFileSelect={handleFileSelect}
              disabled={loading}
            />
            {loading && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-neutral-800 rounded-full" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                </div>
                <p className="text-neutral-400">Extracting text from PDF...</p>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Review Extracted Text</h2>
                    <p className="text-sm text-neutral-500">Edit before saving if needed</p>
                  </div>
                </div>
                <button 
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Upload Different File
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Resume Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Software Engineer Resume"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Extracted Content
                  </label>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-96 px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none"
                    placeholder="Extracted text will appear here..."
                  />
                  <p className="text-xs text-neutral-600 mt-2">
                    You can edit the text before saving
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="gradient"
              onClick={handleSave}
              loading={loading}
              className="w-full !py-4 !text-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Save & Continue to AI Enhancement
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

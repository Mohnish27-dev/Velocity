import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resumeApi, enhanceApi } from '../services/api'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'

export default function Enhance() {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enhancing, setEnhancing] = useState(false)
  
  // Enhancement preferences
  const [preferences, setPreferences] = useState({
    jobRole: '',
    yearsOfExperience: '',
    skills: '',
    industry: '',
    customInstructions: ''
  })

  useEffect(() => {
    fetchResume()
  }, [resumeId])

  const fetchResume = async () => {
    try {
      const response = await resumeApi.getById(resumeId)
      setResume(response.data)
      
      // Pre-fill preferences if available
      if (response.data.preferences) {
        setPreferences({
          jobRole: response.data.jobRole || '',
          yearsOfExperience: response.data.preferences.yearsOfExperience || '',
          skills: response.data.preferences.skills?.join(', ') || '',
          industry: response.data.preferences.industry || '',
          customInstructions: response.data.preferences.customInstructions || ''
        })
      }
    } catch (error) {
      toast.error('Failed to load resume')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target
    setPreferences(prev => ({ ...prev, [name]: value }))
  }

  const handleEnhance = async () => {
    if (!preferences.jobRole.trim()) {
      toast.error('Please enter a target job role')
      return
    }

    setEnhancing(true)
    try {
      // Prepare preferences for API
      const apiPreferences = {
        jobRole: preferences.jobRole,
        yearsOfExperience: parseInt(preferences.yearsOfExperience) || 0,
        skills: preferences.skills.split(',').map(s => s.trim()).filter(Boolean),
        industry: preferences.industry,
        customInstructions: preferences.customInstructions
      }

      // Call enhance API
      const enhanceResponse = await enhanceApi.enhance(
        resume.originalText, 
        apiPreferences
      )

      // Update resume with enhanced text
      await resumeApi.update(resumeId, {
        enhancedText: enhanceResponse.data.enhancedResume,
        jobRole: preferences.jobRole,
        preferences: apiPreferences
      })

      toast.success('Resume enhanced successfully!')
      navigate(`/resume/${resumeId}`)
    } catch (error) {
      toast.error(error.message || 'Failed to enhance resume')
    } finally {
      setEnhancing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Enhance Resume</h1>
          <p className="text-neutral-400">{resume?.title}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Original Text */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Original Resume</h2>
            <div className="bg-neutral-800 rounded-lg p-4 h-96 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-neutral-300 font-mono">
                {resume?.originalText}
              </pre>
            </div>
          </div>

          {/* Enhancement Options */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Enhancement Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Target Job Role <span className="text-red-400">*</span>
                </label>
                <input
                  name="jobRole"
                  value={preferences.jobRole}
                  onChange={handlePreferenceChange}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={preferences.yearsOfExperience}
                  onChange={handlePreferenceChange}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Key Skills (comma separated)
                </label>
                <input
                  name="skills"
                  value={preferences.skills}
                  onChange={handlePreferenceChange}
                  placeholder="e.g., React, Node.js, TypeScript"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Industry
                </label>
                <input
                  name="industry"
                  value={preferences.industry}
                  onChange={handlePreferenceChange}
                  placeholder="e.g., Technology, Finance, Healthcare"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Custom Instructions (optional)
                </label>
                <textarea
                  name="customInstructions"
                  value={preferences.customInstructions}
                  onChange={handlePreferenceChange}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Any specific instructions for the AI..."
                />
              </div>

              <button
                onClick={handleEnhance}
                disabled={enhancing}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enhancing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enhancing with AI...
                  </>
                ) : (
                  'Enhance Resume'
                )}
              </button>
              
              {enhancing && (
                <p className="text-sm text-neutral-500 text-center">
                  This may take a minute...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

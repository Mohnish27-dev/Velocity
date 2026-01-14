import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { fellowshipApi } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Clock,
    IndianRupee,
    Calendar,
    Building2,
    Loader2,
    Send,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

const CATEGORIES = {
    design: { label: 'Design', icon: '🎨' },
    content: { label: 'Content', icon: '✍️' },
    development: { label: 'Development', icon: '💻' },
    research: { label: 'Research', icon: '🔬' },
    marketing: { label: 'Marketing', icon: '📈' },
}

export default function ChallengeDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { profile } = useOutletContext()
    const [challenge, setChallenge] = useState(null)
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [showApplyForm, setShowApplyForm] = useState(false)
    const [coverLetter, setCoverLetter] = useState('')
    const [proposedPrice, setProposedPrice] = useState('')
    const [estimatedDays, setEstimatedDays] = useState('')
    const [portfolioLinks, setPortfolioLinks] = useState('')
    const [applied, setApplied] = useState(false)

    useEffect(() => {
        loadChallenge()
    }, [id])

    const loadChallenge = async () => {
        try {
            const response = await fellowshipApi.getChallenge(id)
            setChallenge(response.data)
        } catch (error) {
            toast.error('Challenge not found')
            navigate('/fellowship/challenges')
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async () => {
        if (!coverLetter || coverLetter.length < 100) {
            toast.error('Cover letter must be at least 100 characters')
            return
        }
        if (!proposedPrice || parseInt(proposedPrice) < 500) {
            toast.error('Minimum proposed price is ₹500')
            return
        }
        if (!estimatedDays || parseInt(estimatedDays) < 1) {
            toast.error('Estimated days must be at least 1')
            return
        }

        setApplying(true)
        try {
            await fellowshipApi.applyToChallenge(id, {
                coverLetter,
                proposedPrice: parseInt(proposedPrice),
                estimatedDays: parseInt(estimatedDays),
                portfolioLinks: portfolioLinks.split('\n').filter(l => l.trim())
            })
            toast.success('Proposal submitted!')
            setApplied(true)
            setShowApplyForm(false)
        } catch (error) {
            toast.error(error.message || 'Failed to submit proposal')
        } finally {
            setApplying(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    if (!challenge) return null

    const category = CATEGORIES[challenge.category] || { label: challenge.category, icon: '📋' }
    const daysLeft = Math.ceil((new Date(challenge.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    const isStudent = profile?.role === 'student'
    const canApply = isStudent && profile?.isVerified && challenge.status === 'open' && !applied

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
                <div className="flex items-start justify-between gap-4">
                    <span className="px-3 py-1 bg-neutral-800 rounded-lg text-sm">
                        {category.icon} {category.label}
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                        ₹{challenge.price.toLocaleString('en-IN')}
                    </span>
                </div>

                <h1 className="mt-4 text-2xl font-bold text-white">{challenge.title}</h1>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {challenge.companyName}
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Deadline: {new Date(challenge.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm text-neutral-500 mb-2">Description</h3>
                    <p className="text-neutral-300 whitespace-pre-wrap">{challenge.description}</p>
                </div>

                {challenge.requirements?.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm text-neutral-500 mb-2">Requirements</h3>
                        <div className="flex flex-wrap gap-2">
                            {challenge.requirements.map((req, i) => (
                                <span key={i} className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-sm">
                                    {req}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 text-xs text-neutral-500">
                    {challenge.proposalCount || 0} proposals received
                </div>
            </motion.div>

            {applied && (
                <div className="bg-emerald-950 border border-emerald-800 rounded-2xl p-6 flex items-center gap-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <div>
                        <h3 className="font-semibold text-emerald-300">Proposal Submitted!</h3>
                        <p className="text-sm text-emerald-400/70">View your proposal in "My Proposals"</p>
                    </div>
                </div>
            )}

            {isStudent && !profile?.isVerified && (
                <div className="bg-amber-950 border border-amber-800 rounded-2xl p-6 flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <div>
                        <h3 className="font-semibold text-amber-300">Verify to Apply</h3>
                        <p className="text-sm text-amber-400/70">You need to verify your student status first</p>
                    </div>
                    <button
                        onClick={() => navigate('/fellowship/verify')}
                        className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500"
                    >
                        Verify Now
                    </button>
                </div>
            )}

            {canApply && !showApplyForm && (
                <button
                    onClick={() => setShowApplyForm(true)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
                >
                    <Send className="w-5 h-5" />
                    Submit Proposal
                </button>
            )}

            {showApplyForm && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4"
                >
                    <h2 className="text-lg font-semibold text-white">Submit Your Proposal</h2>

                    <div>
                        <label className="block text-sm text-neutral-400 mb-2">Cover Letter *</label>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Explain why you're the right fit for this challenge..."
                            rows={5}
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                        <p className="mt-1 text-xs text-neutral-500">{coverLetter.length}/100 minimum</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-neutral-400 mb-2">Your Price (₹) *</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="number"
                                    value={proposedPrice}
                                    onChange={(e) => setProposedPrice(e.target.value)}
                                    placeholder={challenge.price.toString()}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-400 mb-2">Days to Complete *</label>
                            <input
                                type="number"
                                value={estimatedDays}
                                onChange={(e) => setEstimatedDays(e.target.value)}
                                placeholder="7"
                                min="1"
                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-400 mb-2">Portfolio Links (one per line)</label>
                        <textarea
                            value={portfolioLinks}
                            onChange={(e) => setPortfolioLinks(e.target.value)}
                            placeholder="https://yourportfolio.com&#10;https://github.com/yourusername"
                            rows={3}
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowApplyForm(false)}
                            className="px-6 py-3 bg-neutral-800 text-neutral-300 rounded-xl font-medium hover:bg-neutral-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={applying}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {applying ? 'Submitting...' : 'Submit Proposal'}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { fellowshipApi } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    FolderKanban,
    Plus,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    IndianRupee
} from 'lucide-react'

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-emerald-950 text-emerald-400' },
    in_progress: { label: 'In Progress', color: 'bg-blue-950 text-blue-400' },
    completed: { label: 'Completed', color: 'bg-neutral-800 text-neutral-400' },
    cancelled: { label: 'Cancelled', color: 'bg-red-950 text-red-400' },
}

export default function MyChallenges() {
    const navigate = useNavigate()
    const { profile } = useOutletContext()
    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadChallenges()
    }, [])

    const loadChallenges = async () => {
        try {
            const response = await fellowshipApi.getMyChallenges()
            setChallenges(response.data)
        } catch (error) {
            toast.error('Failed to load challenges')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Challenges</h1>
                    <p className="text-neutral-400">Manage your posted challenges</p>
                </div>
                <button
                    onClick={() => navigate('/fellowship/create-challenge')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New Challenge
                </button>
            </div>

            {challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-16">
                    <FolderKanban className="h-12 w-12 text-neutral-600" />
                    <h3 className="mt-4 text-lg font-semibold text-white">No challenges yet</h3>
                    <p className="mt-2 text-sm text-neutral-400">Post your first challenge to find student talent</p>
                    <button
                        onClick={() => navigate('/fellowship/create-challenge')}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Post Challenge
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {challenges.map(challenge => {
                        const status = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.open
                        const daysLeft = Math.ceil((new Date(challenge.deadline) - new Date()) / (1000 * 60 * 60 * 24))

                        return (
                            <motion.div
                                key={challenge._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                                        <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{challenge.description}</p>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-sm ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-emerald-400">
                                        <IndianRupee className="w-4 h-4" />
                                        ₹{challenge.price.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex items-center gap-1 text-neutral-400">
                                        <Users className="w-4 h-4" />
                                        {challenge.proposalCount || 0} proposals
                                    </div>
                                    <div className="flex items-center gap-1 text-neutral-400">
                                        <Clock className="w-4 h-4" />
                                        {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => navigate(`/fellowship/challenges/${challenge._id}`)}
                                        className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-sm hover:bg-neutral-700"
                                    >
                                        View Details
                                    </button>
                                    {challenge.proposalCount > 0 && (
                                        <button
                                            onClick={() => navigate(`/fellowship/challenges/${challenge._id}/proposals`)}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500"
                                        >
                                            Review Proposals
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

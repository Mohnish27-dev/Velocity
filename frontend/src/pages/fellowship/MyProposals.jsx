import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { fellowshipApi } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    IndianRupee,
    ExternalLink
} from 'lucide-react'

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-950 text-yellow-400', icon: Clock },
    shortlisted: { label: 'Shortlisted', color: 'bg-blue-950 text-blue-400', icon: AlertCircle },
    accepted: { label: 'Accepted', color: 'bg-emerald-950 text-emerald-400', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-950 text-red-400', icon: XCircle },
    withdrawn: { label: 'Withdrawn', color: 'bg-neutral-800 text-neutral-400', icon: XCircle },
}

export default function MyProposals() {
    const { profile } = useOutletContext()
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProposals()
    }, [])

    const loadProposals = async () => {
        try {
            const response = await fellowshipApi.getMyProposals()
            setProposals(response.data)
        } catch (error) {
            toast.error('Failed to load proposals')
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
            <div>
                <h1 className="text-2xl font-bold text-white">My Proposals</h1>
                <p className="text-neutral-400">Track your submitted applications</p>
            </div>

            {proposals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-16">
                    <FileText className="h-12 w-12 text-neutral-600" />
                    <h3 className="mt-4 text-lg font-semibold text-white">No proposals yet</h3>
                    <p className="mt-2 text-sm text-neutral-400">Start browsing challenges to submit your first proposal</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {proposals.map((proposal) => {
                        const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.pending
                        const StatusIcon = status.icon

                        return (
                            <motion.div
                                key={proposal._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">
                                            {proposal.challenge?.title || 'Challenge'}
                                        </h3>
                                        <p className="mt-1 text-sm text-neutral-400">
                                            {proposal.challenge?.companyName || 'Company'}
                                        </p>
                                    </div>
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${status.color}`}>
                                        <StatusIcon className="w-4 h-4" />
                                        {status.label}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-emerald-400">
                                        <IndianRupee className="w-4 h-4" />
                                        Your bid: ₹{proposal.proposedPrice.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex items-center gap-1 text-neutral-400">
                                        <Clock className="w-4 h-4" />
                                        {proposal.estimatedDays} days estimated
                                    </div>
                                </div>

                                {proposal.corporateFeedback && (
                                    <div className="mt-4 p-3 bg-neutral-800 rounded-lg">
                                        <p className="text-xs text-neutral-500 mb-1">Feedback from company:</p>
                                        <p className="text-sm text-neutral-300">{proposal.corporateFeedback}</p>
                                    </div>
                                )}

                                <p className="mt-4 text-xs text-neutral-500">
                                    Applied on {new Date(proposal.createdAt).toLocaleDateString()}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

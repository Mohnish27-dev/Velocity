import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { fellowshipApi } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    Search,
    Briefcase,
    TrendingUp,
    Sparkles,
    Filter,
    Clock,
    IndianRupee
} from 'lucide-react'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🎯' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'content', label: 'Content', icon: '✍️' },
    { id: 'development', label: 'Development', icon: '💻' },
    { id: 'research', label: 'Research', icon: '🔬' },
    { id: 'marketing', label: 'Marketing', icon: '📈' },
]

function ChallengeCard({ challenge, onClick }) {
    const daysLeft = Math.ceil((new Date(challenge.deadline) - new Date()) / (1000 * 60 * 60 * 24))

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 cursor-pointer hover:border-emerald-500/50 transition-all"
        >
            <div className="flex items-start justify-between gap-4">
                <span className="text-xs px-2 py-1 bg-neutral-800 rounded-lg">
                    {CATEGORIES.find(c => c.id === challenge.category)?.icon} {challenge.category}
                </span>
                <span className="text-emerald-400 font-bold">₹{challenge.price.toLocaleString('en-IN')}</span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-white line-clamp-2">{challenge.title}</h3>
            <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{challenge.description}</p>

            <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-neutral-500">by {challenge.companyName}</span>
                <div className="flex items-center gap-1 text-neutral-400">
                    <Clock className="w-4 h-4" />
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                </div>
            </div>

            {challenge.proposalCount > 0 && (
                <div className="mt-3 text-xs text-neutral-500">
                    {challenge.proposalCount} proposal{challenge.proposalCount > 1 ? 's' : ''} received
                </div>
            )}
        </motion.div>
    )
}

export default function Challenges() {
    const navigate = useNavigate()
    const { profile } = useOutletContext()
    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    useEffect(() => {
        loadChallenges()
    }, [])

    const loadChallenges = async () => {
        try {
            const response = await fellowshipApi.getChallenges({ status: 'open', limit: 50 })
            setChallenges(response.data.challenges)
        } catch (error) {
            toast.error('Failed to load challenges')
            setChallenges([])
        } finally {
            setLoading(false)
        }
    }

    const filteredChallenges = challenges.filter(challenge => {
        const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const avgReward = challenges.length > 0
        ? Math.round(challenges.reduce((sum, c) => sum + c.price, 0) / challenges.length)
        : 0
    const maxReward = challenges.length > 0
        ? Math.max(...challenges.map(c => c.price))
        : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Browse Challenges</h1>
                    <p className="text-neutral-400">Find opportunities to earn while building your portfolio</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950 text-emerald-400 rounded-lg text-sm">
                        <TrendingUp className="w-3 h-3" />
                        {challenges.length} Open
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">Total</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">{challenges.length}</p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm">Avg. Reward</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">₹{avgReward.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Highest</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-400">₹{maxReward.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm">Categories</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">5</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                        >
                            {cat.id === 'all' ? 'All' : `${cat.icon} ${cat.label}`}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredChallenges.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredChallenges.map(challenge => (
                        <ChallengeCard
                            key={challenge._id || challenge.id}
                            challenge={challenge}
                            onClick={() => navigate(`/fellowship/challenges/${challenge._id || challenge.id}`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-16">
                    <Briefcase className="h-12 w-12 text-neutral-600" />
                    <h3 className="mt-4 text-lg font-semibold text-white">No challenges found</h3>
                    <p className="mt-2 text-sm text-neutral-400">
                        {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters' : 'Check back later for new opportunities'}
                    </p>
                </div>
            )}
        </div>
    )
}

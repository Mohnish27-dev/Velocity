import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { fellowshipApi } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    Mail,
    Loader2,
    CheckCircle,
    ShieldCheck,
    ArrowLeft
} from 'lucide-react'

export default function Verify() {
    const navigate = useNavigate()
    const { profile, refreshProfile } = useOutletContext()
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [step, setStep] = useState('email')
    const [loading, setLoading] = useState(false)

    if (profile?.isVerified) {
        return (
            <div className="max-w-lg mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 border border-emerald-800 rounded-2xl p-8 text-center"
                >
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-white">Already Verified!</h2>
                    <p className="mt-2 text-neutral-400">Your student status has been verified.</p>
                    <button
                        onClick={() => navigate('/fellowship/challenges')}
                        className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
                    >
                        Browse Challenges
                    </button>
                </motion.div>
            </div>
        )
    }

    if (profile?.role !== 'student') {
        return (
            <div className="max-w-lg mx-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                    <p className="text-neutral-400">Verification is only required for student accounts.</p>
                    <button
                        onClick={() => navigate('/fellowship/challenges')}
                        className="mt-4 text-emerald-400 hover:text-emerald-300"
                    >
                        Go to Challenges →
                    </button>
                </div>
            </div>
        )
    }

    const handleSendCode = async () => {
        if (!email.trim()) {
            toast.error('Please enter your academic email')
            return
        }

        setLoading(true)
        try {
            await fellowshipApi.sendVerificationEmail(email)
            toast.success('Verification code sent!')
            setStep('code')
        } catch (error) {
            toast.error(error.message || 'Failed to send verification email')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        if (!verificationCode.trim() || verificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code')
            return
        }

        setLoading(true)
        try {
            await fellowshipApi.confirmVerification(verificationCode)
            toast.success('Verified successfully!')
            if (refreshProfile) await refreshProfile()
            setStep('success')
            setTimeout(() => navigate('/fellowship/challenges'), 1500)
        } catch (error) {
            toast.error(error.message || 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-lg mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
            >
                {step === 'email' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-xl bg-emerald-950 flex items-center justify-center mb-4">
                                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Verify Student Status</h1>
                            <p className="mt-2 text-neutral-400">Use your academic email (.edu, .ac.in, etc.)</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="yourname@university.edu"
                                    className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                onClick={handleSendCode}
                                disabled={loading || !email.trim()}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'code' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-xl bg-emerald-950 flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Enter Code</h1>
                            <p className="mt-2 text-neutral-400">Check your email for the 6-digit code</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-4 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                            />

                            <button
                                onClick={handleVerify}
                                disabled={loading || verificationCode.length !== 6}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                            </button>

                            <button
                                onClick={handleSendCode}
                                disabled={loading}
                                className="w-full py-2 text-neutral-400 hover:text-white text-sm"
                            >
                                Resend code
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-white">Verified!</h2>
                        <p className="mt-2 text-neutral-400">Redirecting...</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

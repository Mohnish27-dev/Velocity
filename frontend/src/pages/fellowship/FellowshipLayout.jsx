import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fellowshipApi } from '../../services/api'
import {
    Briefcase,
    FileText,
    FolderKanban,
    PlusCircle,
    Home,
    GraduationCap,
    Building2,
    ShieldCheck,
    Sparkles,
    Menu,
    X,
    LogOut,
    MessageCircle
} from 'lucide-react'

const NAV_ITEMS = [
    { title: 'Browse Challenges', href: '/fellowship/challenges', icon: Briefcase, roles: ['student'] },
    { title: 'My Proposals', href: '/fellowship/my-proposals', icon: FileText, roles: ['student'] },
    { title: 'My Challenges', href: '/fellowship/my-challenges', icon: FolderKanban, roles: ['corporate'] },
    { title: 'Post Challenge', href: '/fellowship/create-challenge', icon: PlusCircle, roles: ['corporate'] },
    { title: 'Messages', href: '/fellowship/messages', icon: MessageCircle, roles: ['student', 'corporate'] },
]

export default function FellowshipLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        loadProfile()
    }, [user])

    const loadProfile = async () => {
        try {
            const response = await fellowshipApi.getProfile()
            setProfile(response.data)

            if (!response.data?.role && !location.pathname.includes('/onboarding')) {
                navigate('/fellowship/onboarding')
            } else if (response.data?.role === 'corporate' &&
                (location.pathname === '/fellowship' || location.pathname === '/fellowship/challenges')) {
                navigate('/fellowship/my-challenges')
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    <p className="text-neutral-400">Loading...</p>
                </div>
            </div>
        )
    }

    const filteredNavItems = NAV_ITEMS.filter(item =>
        !profile?.role || item.roles.includes(profile.role)
    )

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b border-neutral-800 px-6">
                <NavLink to="/fellowship/challenges" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                        <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white leading-tight">Fellowships</span>
                        <span className="text-[10px] text-neutral-400">by Velocity</span>
                    </div>
                </NavLink>
            </div>

            {profile?.role && (
                <div className="border-b border-neutral-800 px-4 py-3">
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${profile.role === 'corporate'
                        ? 'bg-blue-950 text-blue-300'
                        : 'bg-emerald-950 text-emerald-300'
                        }`}>
                        {profile.role === 'corporate' ? (
                            <><Building2 className="h-4 w-4" /> Corporate Account</>
                        ) : (
                            <><GraduationCap className="h-4 w-4" /> Student Account</>
                        )}
                    </div>

                    {profile.role === 'student' && !profile.isVerified && (
                        <NavLink to="/fellowship/verify" onClick={() => setSidebarOpen(false)}>
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-950 px-3 py-2 text-sm text-amber-300 cursor-pointer hover:bg-amber-900 transition-colors">
                                <ShieldCheck className="h-4 w-4" />
                                Verify to Apply →
                            </div>
                        </NavLink>
                    )}
                </div>
            )}

            <nav className="flex-1 space-y-1 p-4">
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                            ? 'bg-emerald-600 text-white'
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                    </NavLink>
                ))}

                <div className="my-4 border-t border-neutral-800" />

                <NavLink
                    to="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                    <Sparkles className="h-5 w-5" />
                    Back to Dashboard
                </NavLink>
            </nav>

            <div className="border-t border-neutral-800 p-4">
                <div className="flex items-center gap-3 rounded-lg bg-neutral-800 p-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-700 flex items-center justify-center text-white font-medium">
                        {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-white">{user?.displayName || 'User'}</p>
                        <p className="truncate text-xs text-neutral-400">{user?.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen bg-neutral-950">
            <aside className="hidden w-64 border-r border-neutral-800 bg-neutral-900 lg:block">
                <SidebarContent />
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-64 bg-neutral-900">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-neutral-400 hover:text-white"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-white lg:hidden">Fellowships</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet context={{ profile, refreshProfile: loadProfile }} />
                </main>
            </div>
        </div>
    )
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/fellowships/ChallengeCard';
import { Search, Filter, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOpenChallenges } from '@/lib/firebase/fellowships';
import type { Challenge, ChallengeCategory } from '@/types/fellowships';
import { CHALLENGE_CATEGORIES } from '@/types/fellowships';

const categories: (ChallengeCategory | 'all')[] = ['all', 'design', 'content', 'development', 'research', 'marketing'];

export default function FellowshipsPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>('all');

    useEffect(() => {
        loadChallenges();
    }, []);

    const loadChallenges = async () => {
        try {
            setLoading(true);
            const data = await getOpenChallenges(50);
            setChallenges(data);
        } catch (error) {
            console.error('Error loading challenges:', error);
            // For demo, use mock data if Firebase fails
            setChallenges(getMockChallenges());
        } finally {
            setLoading(false);
        }
    };

    const filteredChallenges = challenges.filter((challenge) => {
        const matchesSearch =
            challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Browse Challenges</h1>
                    <p className="text-muted-foreground">
                        Find opportunities to earn while building your portfolio
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {challenges.length} Open
                    </Badge>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">Total Challenges</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{challenges.length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm">Avg. Reward</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        ₹{challenges.length > 0
                            ? Math.round(challenges.reduce((sum, c) => sum + c.price, 0) / challenges.length).toLocaleString('en-IN')
                            : '0'}
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Highest Reward</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{challenges.length > 0
                            ? Math.max(...challenges.map(c => c.price)).toLocaleString('en-IN')
                            : '0'}
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm">Categories</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">5</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                selectedCategory === cat && 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                            )}
                        >
                            {cat === 'all' ? 'All' : CHALLENGE_CATEGORIES[cat].icon + ' ' + CHALLENGE_CATEGORIES[cat].label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Challenges Grid */}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <ChallengeCardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredChallenges.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
                    <Briefcase className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No challenges found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {searchQuery || selectedCategory !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Check back later for new opportunities'}
                    </p>
                </div>
            )}
        </div>
    );
}

// Mock data for demo when Firebase is not configured
function getMockChallenges(): Challenge[] {
    return [
        {
            id: 'demo-1',
            title: 'Design a Modern Logo for TechStart',
            description: 'We are a tech startup looking for a clean, modern logo that represents innovation and trust. The logo should work well in both light and dark modes.',
            price: 5000,
            status: 'open',
            corporateId: 'corp-1',
            corporateName: 'Raj Kumar',
            companyName: 'TechStart India',
            category: 'design',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            requirements: ['Adobe Illustrator', 'Brand Guidelines', 'Multiple Variations'],
            proposalCount: 12,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'demo-2',
            title: 'Write SEO Blog Posts for EdTech Platform',
            description: 'Need 5 well-researched blog posts about online learning trends, each 1500+ words. Topics include AI in education, remote learning tips, etc.',
            price: 8000,
            status: 'open',
            corporateId: 'corp-2',
            corporateName: 'Priya Sharma',
            companyName: 'LearnHub',
            category: 'content',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            requirements: ['SEO Knowledge', 'Research Skills', 'Education Background'],
            proposalCount: 8,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'demo-3',
            title: 'Build a React Dashboard Component',
            description: 'Create a reusable analytics dashboard component with charts, filters, and data export functionality. Must use React and Tailwind CSS.',
            price: 15000,
            status: 'open',
            corporateId: 'corp-3',
            corporateName: 'Amit Patel',
            companyName: 'DataViz Solutions',
            category: 'development',
            deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            requirements: ['React', 'TypeScript', 'Chart.js or Recharts', 'Tailwind CSS'],
            proposalCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'demo-4',
            title: 'Market Research on College Students',
            description: 'Conduct a survey-based research on spending habits of college students in Tier 1 cities. Need minimum 200 responses with analysis report.',
            price: 10000,
            status: 'open',
            corporateId: 'corp-4',
            corporateName: 'Neha Gupta',
            companyName: 'ConsumerInsights',
            category: 'research',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            requirements: ['Survey Design', 'Data Analysis', 'Report Writing'],
            proposalCount: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'demo-5',
            title: 'Create Instagram Marketing Campaign',
            description: 'Design a 2-week Instagram campaign for our new fitness app launch. Includes post designs, captions, and hashtag strategy.',
            price: 7500,
            status: 'open',
            corporateId: 'corp-5',
            corporateName: 'Vikram Singh',
            companyName: 'FitLife App',
            category: 'marketing',
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            requirements: ['Canva/Figma', 'Copywriting', 'Social Media Strategy'],
            proposalCount: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'demo-6',
            title: 'UI/UX Design for Mobile Banking App',
            description: 'Design complete UI/UX for a neo-banking app targeting Gen-Z. Need wireframes, high-fidelity designs, and prototype.',
            price: 25000,
            status: 'open',
            corporateId: 'corp-6',
            corporateName: 'Rahul Mehta',
            companyName: 'NeoBank',
            category: 'design',
            deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            requirements: ['Figma', 'Mobile Design', 'User Research', 'Prototyping'],
            proposalCount: 7,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
}

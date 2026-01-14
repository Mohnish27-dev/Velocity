'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/fellowships/ChallengeCard';
import { Loader2, Plus, Briefcase, IndianRupee, Users, TrendingUp } from 'lucide-react';
import { getChallenges } from '@/lib/firebase/fellowships';
import type { Challenge } from '@/types/fellowships';

export default function MyChallengesPage() {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadChallenges();
        }
    }, [user?.uid]);

    const loadChallenges = async () => {
        try {
            setLoading(true);
            const data = await getChallenges({ corporateId: user!.uid });
            setChallenges(data);
        } catch (error) {
            console.error('Error loading challenges:', error);
            // Demo data
            setChallenges(getMockChallenges());
        } finally {
            setLoading(false);
        }
    };

    const openChallenges = challenges.filter(c => c.status === 'open');
    const inProgressChallenges = challenges.filter(c => c.status === 'in_progress');
    const completedChallenges = challenges.filter(c => c.status === 'completed');

    const totalSpent = completedChallenges.reduce((sum, c) => sum + c.price, 0);
    const totalProposals = challenges.reduce((sum, c) => sum + (c.proposalCount || 0), 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <ChallengeCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Challenges</h1>
                    <p className="text-muted-foreground">
                        Manage your posted challenges and hire talent
                    </p>
                </div>
                <Link href="/fellowships/create-challenge">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4" />
                        Post New Challenge
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span className="text-sm">Total Posted</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">{challenges.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">Total Proposals</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">{totalProposals}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm">Active</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                            {openChallenges.length + inProgressChallenges.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-sm">Total Paid</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Challenges by Status */}
            {challenges.length > 0 ? (
                <div className="space-y-8">
                    {/* Open Challenges */}
                    {openChallenges.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                                    Open
                                </Badge>
                                {openChallenges.length} challenges accepting proposals
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {openChallenges.map((challenge) => (
                                    <ChallengeCard key={challenge.id} challenge={challenge} isOwner />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* In Progress */}
                    {inProgressChallenges.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    In Progress
                                </Badge>
                                {inProgressChallenges.length} challenges being worked on
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {inProgressChallenges.map((challenge) => (
                                    <ChallengeCard key={challenge.id} challenge={challenge} isOwner />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed */}
                    {completedChallenges.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    Completed
                                </Badge>
                                {completedChallenges.length} challenges completed
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {completedChallenges.map((challenge) => (
                                    <ChallengeCard key={challenge.id} challenge={challenge} isOwner showActions={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center py-12">
                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No challenges posted yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create your first challenge to start hiring student talent
                        </p>
                        <Link href="/fellowships/create-challenge">
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Post Your First Challenge
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function getMockChallenges(): Challenge[] {
    return [
        {
            id: 'my-1',
            title: 'Build a Landing Page for SaaS Product',
            description: 'Need a modern, responsive landing page built with React and Tailwind CSS.',
            price: 12000,
            status: 'in_progress',
            corporateId: 'user-1',
            corporateName: 'Your Company',
            companyName: 'Your Company',
            category: 'development',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            requirements: ['React', 'Tailwind CSS', 'Responsive Design'],
            proposalCount: 8,
            selectedProposalId: 'prop-1',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
        {
            id: 'my-2',
            title: 'Create Social Media Content Calendar',
            description: 'Looking for creative content ideas for Instagram and LinkedIn.',
            price: 6000,
            status: 'open',
            corporateId: 'user-1',
            corporateName: 'Your Company',
            companyName: 'Your Company',
            category: 'marketing',
            deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            requirements: ['Content Strategy', 'Copywriting'],
            proposalCount: 4,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
    ];
}

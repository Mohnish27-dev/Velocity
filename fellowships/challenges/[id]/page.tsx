'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Clock,
    Users,
    IndianRupee,
    Building2,
    CheckCircle,
    AlertTriangle,
    ShieldCheck,
    Loader2,
    Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getChallenge, createProposal, hasStudentApplied } from '@/lib/firebase/fellowships';
import type { Challenge } from '@/types/fellowships';
import { CHALLENGE_CATEGORIES, CHALLENGE_STATUS_LABELS } from '@/types/fellowships';

export default function ChallengeDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const challengeId = params.id as string;
    const isVerified = (user as unknown as { isVerified?: boolean })?.isVerified;
    const userRole = (user as unknown as { role?: string })?.role || 'student';

    useEffect(() => {
        if (challengeId) {
            loadChallenge();
        }
    }, [challengeId]);

    useEffect(() => {
        if (searchParams.get('apply') === 'true' && challenge && !hasApplied) {
            setShowApplyModal(true);
        }
    }, [searchParams, challenge, hasApplied]);

    const loadChallenge = async () => {
        try {
            setLoading(true);
            const data = await getChallenge(challengeId);
            if (data) {
                setChallenge(data);
                // Check if user has already applied
                if (user?.uid) {
                    const applied = await hasStudentApplied(challengeId, user.uid);
                    setHasApplied(applied);
                }
            } else {
                // Demo data for non-Firebase environment
                setChallenge(getMockChallenge(challengeId));
            }
        } catch (error) {
            console.error('Error loading challenge:', error);
            setChallenge(getMockChallenge(challengeId));
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!user || !challenge || coverLetter.trim().length < 50) return;

        try {
            setSubmitting(true);
            await createProposal({
                challengeId: challenge.id,
                challengeTitle: challenge.title,
                studentId: user.uid,
                studentName: user.profile?.name || 'Student',
                studentEmail: user.email,
                coverLetter: coverLetter.trim(),
            });
            setSubmitSuccess(true);
            setHasApplied(true);
            setTimeout(() => {
                setShowApplyModal(false);
                setSubmitSuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Error submitting proposal:', error);
            // For demo, simulate success
            setSubmitSuccess(true);
            setHasApplied(true);
            setTimeout(() => {
                setShowApplyModal(false);
                setSubmitSuccess(false);
            }, 2000);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-semibold">Challenge not found</h2>
                <Link href="/fellowships/challenges">
                    <Button variant="link">Back to challenges</Button>
                </Link>
            </div>
        );
    }

    const category = CHALLENGE_CATEGORIES[challenge.category];
    const status = CHALLENGE_STATUS_LABELS[challenge.status];
    const deadline = new Date(challenge.deadline);
    const isExpired = deadline < new Date();
    const isOpen = challenge.status === 'open' && !isExpired;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Challenge Header */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={cn("text-sm", category.color)}>
                            {category.icon} {category.label}
                        </Badge>
                        <Badge variant="outline" className={status.color}>
                            {status.label}
                        </Badge>
                        {isExpired && (
                            <Badge variant="destructive">Deadline Passed</Badge>
                        )}
                    </div>
                    <CardTitle className="mt-4 text-2xl">{challenge.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{challenge.companyName || challenge.corporateName}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Key Info */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border p-4 text-center">
                            <IndianRupee className="mx-auto h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{challenge.price.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-muted-foreground">Reward</p>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                            <Clock className="mx-auto h-5 w-5 text-muted-foreground" />
                            <p className="mt-2 text-lg font-semibold">
                                {isExpired ? 'Expired' : formatDistanceToNow(deadline)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {format(deadline, 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                            <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                            <p className="mt-2 text-lg font-semibold">{challenge.proposalCount || 0}</p>
                            <p className="text-xs text-muted-foreground">Proposals</p>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                            <CheckCircle className="mx-auto h-5 w-5 text-muted-foreground" />
                            <p className="mt-2 text-lg font-semibold capitalize">{challenge.status}</p>
                            <p className="text-xs text-muted-foreground">Status</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold">About this Challenge</h3>
                        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                            {challenge.description}
                        </p>
                    </div>

                    {/* Requirements */}
                    {challenge.requirements && challenge.requirements.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold">Requirements</h3>
                            <ul className="mt-2 space-y-2">
                                {challenge.requirements.map((req, i) => (
                                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {userRole === 'student' && (
                        <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row">
                            {hasApplied ? (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">You have applied to this challenge</span>
                                </div>
                            ) : isOpen ? (
                                <Button
                                    size="lg"
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                    onClick={() => setShowApplyModal(true)}
                                >
                                    <Send className="h-4 w-4" />
                                    Apply Now
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>This challenge is no longer accepting applications</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Apply Modal */}
            <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
                <DialogContent className="sm:max-w-lg">
                    {submitSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Application Submitted!</h3>
                            <p className="mt-2 text-center text-muted-foreground">
                                Your proposal has been sent. You'll be notified when the company responds.
                            </p>
                        </div>
                    ) : !isVerified ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                                    Verification Required
                                </DialogTitle>
                                <DialogDescription>
                                    You need to verify your student status before applying to challenges.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                <p className="text-sm">
                                    Verification helps companies trust that they're working with genuine students.
                                    It only takes a minute!
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                                    Cancel
                                </Button>
                                <Link href="/fellowships/verify">
                                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                                        Verify Now
                                    </Button>
                                </Link>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Apply to Challenge</DialogTitle>
                                <DialogDescription>
                                    Write a compelling proposal to {challenge.companyName || challenge.corporateName}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Your Proposal</label>
                                    <Textarea
                                        placeholder="Tell them why you're the perfect fit for this challenge. Mention your relevant skills, experience, and how you plan to approach this project..."
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        className="mt-2 min-h-[150px]"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Minimum 50 characters. {coverLetter.length}/50
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted p-3 text-sm">
                                    <p className="font-medium">💡 Tips for a great proposal:</p>
                                    <ul className="mt-2 space-y-1 text-muted-foreground">
                                        <li>• Mention specific skills relevant to this challenge</li>
                                        <li>• Share links to your portfolio or past work</li>
                                        <li>• Explain your approach to solving the problem</li>
                                    </ul>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    disabled={coverLetter.trim().length < 50 || submitting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Submit Proposal
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getMockChallenge(id: string): Challenge {
    return {
        id,
        title: 'Design a Modern Logo for TechStart',
        description: `We are a tech startup looking for a clean, modern logo that represents innovation and trust.

Key Requirements:
- The logo should work well in both light and dark modes
- We need versions for web, mobile app, and social media
- The design should feel premium and professional
- We prefer a minimalist approach but open to creative ideas

About Us:
TechStart is a B2B SaaS platform helping small businesses automate their operations. Our target audience is tech-savvy entrepreneurs aged 25-45.

Deliverables:
- Primary logo in SVG and PNG formats
- Icon/favicon version
- Brand color palette
- Basic usage guidelines`,
        price: 5000,
        status: 'open',
        corporateId: 'corp-1',
        corporateName: 'Raj Kumar',
        companyName: 'TechStart India',
        category: 'design',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requirements: ['Adobe Illustrator or Figma', 'Brand Design Experience', 'SVG Export Knowledge'],
        proposalCount: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

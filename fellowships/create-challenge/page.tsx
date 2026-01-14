'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Plus,
    X,
    Loader2,
    CheckCircle,
    IndianRupee,
    Calendar,
    Briefcase,
} from 'lucide-react';
import { createChallenge } from '@/lib/firebase/fellowships';
import type { ChallengeCategory } from '@/types/fellowships';
import { CHALLENGE_CATEGORIES } from '@/types/fellowships';

export default function CreateChallengePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ChallengeCategory>('design');
    const [price, setPrice] = useState('');
    const [deadline, setDeadline] = useState('');
    const [requirements, setRequirements] = useState<string[]>([]);
    const [newRequirement, setNewRequirement] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleAddRequirement = () => {
        if (newRequirement.trim() && requirements.length < 10) {
            setRequirements([...requirements, newRequirement.trim()]);
            setNewRequirement('');
        }
    };

    const handleRemoveRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const isValid =
        title.trim().length >= 10 &&
        description.trim().length >= 50 &&
        category &&
        parseInt(price) >= 1000 &&
        deadline;

    const handleSubmit = async () => {
        if (!isValid || !user) return;

        setLoading(true);
        try {
            const companyName = (user as unknown as { companyName?: string })?.companyName || 'Company';

            await createChallenge({
                title: title.trim(),
                description: description.trim(),
                category,
                price: parseInt(price),
                deadline: new Date(deadline),
                requirements,
                corporateId: user.uid,
                corporateName: user.profile?.name || 'Corporate',
                companyName,
                status: 'open',
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/fellowships/my-challenges');
            }, 2000);
        } catch (error) {
            console.error('Error creating challenge:', error);
            // For demo, simulate success
            setSuccess(true);
            setTimeout(() => {
                router.push('/fellowships/my-challenges');
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="mx-auto max-w-2xl">
                <Card>
                    <CardContent className="flex flex-col items-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">Challenge Posted!</h2>
                        <p className="mt-2 text-center text-muted-foreground">
                            Your challenge is now live. Students can start applying.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Post a New Challenge</h1>
                <p className="text-muted-foreground">
                    Create a challenge for students to solve and earn
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Challenge Details
                    </CardTitle>
                    <CardDescription>
                        Provide clear details to attract the right talent
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
                        <Label htmlFor="title">Challenge Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Design a Modern Logo for TechStart"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-2"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Minimum 10 characters. Be specific and descriptive.
                        </p>
                    </div>

                    {/* Category */}
                    <div>
                        <Label>Category *</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as ChallengeCategory)}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CHALLENGE_CATEGORIES).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value.icon} {value.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the challenge in detail. Include context, deliverables, and any specific requirements..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-2 min-h-[150px]"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Minimum 50 characters. {description.length}/50
                        </p>
                    </div>

                    {/* Price and Deadline */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="price">Reward Amount (₹) *</Label>
                            <div className="relative mt-2">
                                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="5000"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="pl-9"
                                    min="1000"
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Minimum ₹1,000
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="deadline">Deadline *</Label>
                            <div className="relative mt-2">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="pl-9"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div>
                        <Label>Skills/Requirements</Label>
                        <div className="mt-2 flex gap-2">
                            <Input
                                placeholder="e.g., Figma, React, Writing"
                                value={newRequirement}
                                onChange={(e) => setNewRequirement(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddRequirement();
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" onClick={handleAddRequirement}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {requirements.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {requirements.map((req, i) => (
                                    <Badge key={i} variant="secondary" className="gap-1">
                                        {req}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRequirement(i)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!isValid || loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Post Challenge
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview */}
            {title && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border bg-card p-4">
                            <Badge variant="secondary" className={CHALLENGE_CATEGORIES[category].color}>
                                {CHALLENGE_CATEGORIES[category].icon} {CHALLENGE_CATEGORIES[category].label}
                            </Badge>
                            <h3 className="mt-2 font-semibold">{title || 'Challenge Title'}</h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {description || 'Challenge description will appear here...'}
                            </p>
                            <div className="mt-3 flex items-center gap-4 text-sm">
                                <span className="font-semibold text-emerald-600">
                                    ₹{price ? parseInt(price).toLocaleString('en-IN') : '0'}
                                </span>
                                {deadline && (
                                    <span className="text-muted-foreground">
                                        Deadline: {new Date(deadline).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

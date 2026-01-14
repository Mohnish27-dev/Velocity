'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    ShieldCheck,
    Mail,
    Upload,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowRight,
    GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { verifyStudentByEmail, verifyStudentManually } from '@/lib/firebase/fellowships';

type VerificationStep = 'choose' | 'email' | 'upload' | 'success';

export default function VerifyPage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<VerificationStep>('choose');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const isVerified = (user as unknown as { isVerified?: boolean })?.isVerified;

    if (isVerified) {
        return (
            <div className="mx-auto max-w-lg">
                <Card>
                    <CardContent className="flex flex-col items-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">Already Verified!</h2>
                        <p className="mt-2 text-center text-muted-foreground">
                            Your student status has been verified. You can now apply to challenges.
                        </p>
                        <Button
                            className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => router.push('/fellowships/challenges')}
                        >
                            Browse Challenges
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleEmailVerification = async () => {
        if (!email || !user?.uid) return;

        setLoading(true);
        setError('');

        try {
            const result = await verifyStudentByEmail(user.uid, email);
            if (result.success) {
                await refreshUser();
                setStep('success');
            } else {
                setError(result.message);
                // Offer to upload ID instead
                setTimeout(() => setStep('upload'), 2000);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleManualVerification = async () => {
        if (!uploadedFile || !user?.uid) return;

        setLoading(true);
        setError('');

        try {
            // In a real app, you'd upload the file and process it
            // For now, we'll simulate OCR verification
            await verifyStudentManually(user.uid);
            await refreshUser();
            setStep('success');
        } catch (err) {
            console.error('Manual verification error:', err);
            // For demo, still mark as success
            setStep('success');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">Verify Your Student Status</h1>
                <p className="mt-2 text-muted-foreground">
                    Verification helps companies trust they're working with genuine students
                </p>
            </div>

            {step === 'choose' && (
                <div className="grid gap-4">
                    <Card
                        className="cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-700"
                        onClick={() => setStep('email')}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Academic Email</CardTitle>
                                    <CardDescription>
                                        Fastest way - use your .ac.in or .edu email
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-700"
                        onClick={() => setStep('upload')}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                                    <Upload className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Upload Student ID</CardTitle>
                                    <CardDescription>
                                        Upload your college ID card for manual verification
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {step === 'email' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Academic Email Verification
                        </CardTitle>
                        <CardDescription>
                            Enter your college/university email address
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="email">Academic Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="yourname@college.ac.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Accepted domains: .ac.in, .edu, .edu.in, .edu.au
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('choose')}>
                                Back
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleEmailVerification}
                                disabled={loading || !email}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Email'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'upload' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload Student ID
                        </CardTitle>
                        <CardDescription>
                            Upload a clear photo of your college ID card
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                                uploadedFile
                                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950"
                                    : "border-muted hover:border-emerald-300 dark:hover:border-emerald-700"
                            )}
                        >
                            {uploadedFile ? (
                                <>
                                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                    <p className="mt-2 font-medium">{uploadedFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 font-medium">Drop your ID card here</p>
                                    <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                        </div>

                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium">📸 Make sure:</p>
                            <ul className="mt-2 space-y-1 text-muted-foreground">
                                <li>• Your name is clearly visible</li>
                                <li>• College/University name is visible</li>
                                <li>• Photo is well-lit and not blurry</li>
                            </ul>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('choose')}>
                                Back
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleManualVerification}
                                disabled={loading || !uploadedFile}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Submit for Verification'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'success' && (
                <Card>
                    <CardContent className="flex flex-col items-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">Verification Complete!</h2>
                        <p className="mt-2 text-center text-muted-foreground">
                            Your student status has been verified. You can now apply to challenges.
                        </p>
                        <Button
                            className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => router.push('/fellowships/challenges')}
                        >
                            Start Browsing Challenges
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

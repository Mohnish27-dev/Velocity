'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    Home,
    ArrowRight,
    IndianRupee,
    Lock,
    Unlock,
    MessageSquare,
    Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getProjectRoomsByUser } from '@/lib/firebase/fellowships';
import { useRoomPresence } from '@/hooks/useRoomPresence';
import type { ProjectRoom } from '@/types/fellowships';
import { ESCROW_STATUS_LABELS } from '@/types/fellowships';

export default function RoomsPage() {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<ProjectRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadRooms();
        }
    }, [user?.uid]);

    const loadRooms = async () => {
        try {
            setLoading(true);
            const data = await getProjectRoomsByUser(user!.uid);
            setRooms(data);
        } catch (error) {
            console.error('Error loading rooms:', error);
            // Demo data
            setRooms(getMockRooms());
        } finally {
            setLoading(false);
        }
    };

    const activeRooms = rooms.filter(r => r.status === 'active');
    const completedRooms = rooms.filter(r => r.status === 'completed');

    // Get room IDs for presence tracking
    const roomIds = useMemo(() => rooms.map(r => r.id), [rooms]);
    const { presence, isConnected: presenceConnected } = useRoomPresence({ roomIds });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Project Rooms</h1>
                <p className="text-muted-foreground">
                    Your active and completed project collaborations
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{rooms.length}</div>
                        <p className="text-sm text-muted-foreground">Total Projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">{activeRooms.length}</div>
                        <p className="text-sm text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            ₹{rooms.reduce((sum, r) => sum + r.escrowAmount, 0).toLocaleString('en-IN')}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                    </CardContent>
                </Card>
            </div>

            {/* Rooms List */}
            {rooms.length > 0 ? (
                <div className="space-y-8">
                    {/* Active Rooms */}
                    {activeRooms.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    Active
                                </Badge>
                                {activeRooms.length} ongoing projects
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {activeRooms.map((room) => (
                                    <RoomCard
                                        key={room.id}
                                        room={room}
                                        userId={user!.uid}
                                        hasActiveUsers={!!presence[room.id]?.userCount}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Rooms */}
                    {completedRooms.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    Completed
                                </Badge>
                                {completedRooms.length} finished projects
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {completedRooms.map((room) => (
                                    <RoomCard
                                        key={room.id}
                                        room={room}
                                        userId={user!.uid}
                                        hasActiveUsers={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center py-12">
                        <Home className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No project rooms yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground text-center">
                            Project rooms are created when your proposal is selected or you select a student for your challenge
                        </p>
                        <Link href="/fellowships/challenges">
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                Browse Challenges
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function RoomCard({ room, userId, hasActiveUsers }: { room: ProjectRoom; userId: string; hasActiveUsers: boolean }) {
    const isCorporate = room.corporateId === userId;
    const escrowStatus = ESCROW_STATUS_LABELS[room.escrowStatus];

    return (
        <Card className="transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{room.challengeTitle}</CardTitle>
                            {hasActiveUsers && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 flex items-center gap-1">
                                    <Radio className="h-3 w-3 animate-pulse" />
                                    Live
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isCorporate ? `Student: ${room.studentName}` : `Company: ${room.corporateName}`}
                        </p>
                    </div>
                    <Badge className={cn("ml-2", escrowStatus.color)}>
                        {room.escrowStatus === 'held' ? (
                            <><Lock className="h-3 w-3 mr-1" /> In Escrow</>
                        ) : (
                            <><Unlock className="h-3 w-3 mr-1" /> Released</>
                        )}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 font-semibold text-emerald-600">
                            <IndianRupee className="h-4 w-4" />
                            {room.escrowAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-muted-foreground">
                            Started {format(new Date(room.createdAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                    <Link href={`/fellowships/room/${room.id}`}>
                        <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                            <MessageSquare className="h-4 w-4" />
                            Open Room
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function getMockRooms(): ProjectRoom[] {
    return [
        {
            id: 'room-1',
            challengeId: 'demo-1',
            challengeTitle: 'Design a Modern Logo for TechStart',
            studentId: 'student-1',
            studentName: 'Priya Sharma',
            corporateId: 'corp-1',
            corporateName: 'TechStart India',
            escrowStatus: 'held',
            escrowAmount: 5000,
            status: 'active',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'room-2',
            challengeId: 'demo-3',
            challengeTitle: 'Build a React Dashboard Component',
            studentId: 'student-1',
            studentName: 'Priya Sharma',
            corporateId: 'corp-3',
            corporateName: 'DataViz Solutions',
            escrowStatus: 'released',
            escrowAmount: 15000,
            status: 'completed',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
    ];
}

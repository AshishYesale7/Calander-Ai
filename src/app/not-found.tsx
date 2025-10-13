
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Home, UserCircle, Frown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-center">
        <Card className="frosted-glass w-full max-w-md p-6">
            <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <Frown className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="font-headline text-3xl text-primary">404 - Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg text-foreground/80">
                    The page or profile you are looking for does not exist.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            <Home className="mr-2 h-4 w-4" />
                            Return to Dashboard
                        </Link>
                    </Button>
                    {user?.username && (
                        <Button asChild>
                            <Link href={`/profile/${user.username}`}>
                                <UserCircle className="mr-2 h-4 w-4" />
                                View Your Profile
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

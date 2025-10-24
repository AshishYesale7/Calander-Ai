
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MyClanView = () => (
  <Card className="frosted-glass">
    <CardHeader>
      <CardTitle>Your Clan</CardTitle>
      <CardDescription>You are not currently in a clan.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-center text-muted-foreground">Join a clan or create your own to start collaborating!</p>
    </CardContent>
  </Card>
);

const FindClansView = () => (
    <Card className="frosted-glass">
        <CardHeader>
            <CardTitle>Find Clans</CardTitle>
            <CardDescription>Search for clans to join.</CardDescription>
        </CardHeader>
        <CardContent>
             <p className="text-center text-muted-foreground">Clan search functionality coming soon.</p>
        </CardContent>
    </Card>
);

const CreateClanView = () => (
     <Card className="frosted-glass">
        <CardHeader>
            <CardTitle>Create a New Clan</CardTitle>
            <CardDescription>Build a team for your next big project.</CardDescription>
        </CardHeader>
        <CardContent>
             <p className="text-center text-muted-foreground">Clan creation functionality coming soon.</p>
             <Button className="w-full mt-4">Create Clan</Button>
        </CardContent>
    </Card>
);

export default function ClansPage() {
  return (
    <div className="space-y-8 bg-gray-900/20 p-6 rounded-lg">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
          <Users className="mr-3 h-8 w-8 text-accent" />
          Clans
        </h1>
        <p className="text-foreground/80 mt-1">
          Team up, collaborate on projects, and compete in hackathons.
        </p>
      </div>

      <Tabs defaultValue="my-clan" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-clan"><Shield className="mr-2 h-4 w-4" />My Clan</TabsTrigger>
          <TabsTrigger value="find-clans"><Search className="mr-2 h-4 w-4" />Find Clans</TabsTrigger>
          <TabsTrigger value="create-clan"><Users className="mr-2 h-4 w-4" />Create Clan</TabsTrigger>
        </TabsList>
        <TabsContent value="my-clan" className="mt-4">
          <MyClanView />
        </TabsContent>
        <TabsContent value="find-clans" className="mt-4">
          <FindClansView />
        </TabsContent>
        <TabsContent value="create-clan" className="mt-4">
          <CreateClanView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

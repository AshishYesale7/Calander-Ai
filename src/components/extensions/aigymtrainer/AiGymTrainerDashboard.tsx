
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AiGymTrainerLogo } from "@/components/logo/AiGymTrainerLogo";
import { Dumbbell } from "lucide-react";


export default function AiGymTrainerDashboard() {
    
    const newBgStyle = {
        backgroundImage: 'url(https://t3.ftcdn.net/jpg/07/64/35/60/360_F_764356037_r3JjDGtxqV6LvropuUkrf6IVseSillSc.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={newBgStyle}>
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="mb-8 text-center">
                    <AiGymTrainerLogo className="h-24 w-24 mx-auto text-yellow-400 drop-shadow-lg" />
                    <h1 className="text-4xl font-bold font-headline text-white/90 drop-shadow-md mt-4">
                        AI Gym Trainer
                    </h1>
                    <p className="text-white/70 mt-2">Your personalized AI fitness coach.</p>
                </div>

                <Card className="frosted-glass bg-black/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Dumbbell />
                           Generate a New Workout
                        </CardTitle>
                        <CardDescription>
                            Tell the AI your goals and get a personalized plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for form */}
                        <div className="h-64 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center">
                            <p className="text-muted-foreground">Workout generation form will be here.</p>
                        </div>
                        <Button className="w-full mt-4 bg-accent hover:bg-accent/90">Generate Workout</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


    
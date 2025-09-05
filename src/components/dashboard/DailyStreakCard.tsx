
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStreak } from '@/context/StreakContext';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { eachDayOfWeek, format, startOfWeek, getDay, isSameDay } from 'date-fns';

const FlameIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#FFC936"/>
        <path d="M24.0001 12.3428C24.0001 12.3428 27.5059 15.8485 27.5059 19.8654C27.5059 23.8824 24.0001 27.3882 24.0001 27.3882C24.0001 27.3882 20.4943 23.8824 20.4943 19.8654C20.4943 15.8485 24.0001 12.3428 24.0001 12.3428Z" fill="#FFF4D8"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M24 8C19.5817 8 16 11.5817 16 16C16 18.5933 17.6973 20.9103 20.0024 22.5857C19.824 23.1118 19.7027 23.6669 19.6416 24.2415C18.6657 24.0321 17.7554 23.5133 17.0396 22.7975C14.8001 20.558 14.8001 16.942 17.0396 14.7025C19.2791 12.463 22.8951 12.463 25.1346 14.7025C25.4362 15.0041 25.702 15.3364 25.9288 15.694C26.5779 14.6152 27.7593 13.0645 27.7634 13.0601C27.7952 13.0247 27.8243 12.9912 27.8504 12.9599C28.5996 11.9545 28.1887 10.5186 27.1833 9.76943C26.1779 9.02022 24.742 9.43103 23.9928 10.4365L23.9784 10.4552C23.3676 11.2333 22.1813 12.792 22.1764 12.7974C21.8489 12.1802 21.3934 11.6441 20.8284 11.1716C17.8548 8.19796 12.9118 8.19796 9.93823 11.1716C6.96464 14.1452 6.96464 19.0882 9.93823 22.0618C12.9118 25.0354 17.8548 25.0354 20.8284 22.0618C21.054 21.8362 21.261 21.6001 21.4485 21.355C21.9366 23.0135 22.8465 24.5208 24.0869 25.761C24.0583 25.8407 24.0298 25.9203 24.0012 25.9998C24.0005 26.0016 23.9998 26.0033 23.9991 26.0051C23.882 26.311 23.6335 27.247 24.0041 28.0163C24.3986 28.8344 25.4382 29.1764 26.2413 28.7616C26.7901 28.4892 27.5029 27.6713 27.8289 27.1843C29.0754 26.5493 30.1444 25.6888 31.0204 24.6393C33.0232 22.5317 33.7422 19.6582 32.8893 17.153C32.716 16.6433 32.4839 16.1685 32.2014 15.7369C31.5435 17.5167 30.222 19.043 28.4907 20.084C27.9133 20.4357 27.2435 20.6272 26.5471 20.6272C25.1384 20.6272 23.9213 19.6457 23.6062 18.2831C23.5186 17.9254 23.4735 17.5557 23.4735 17.1765C23.4735 16.5882 23.5852 16.0276 23.7849 15.5101C23.8291 15.3912 23.8767 15.2755 23.9272 15.1627C23.6548 15.2785 23.3644 15.4293 23.0583 15.612C22.2599 16.0888 21.2057 16.0888 20.4073 15.612C19.6089 15.1352 19.1897 14.2384 19.1897 13.2927C19.1897 12.3469 19.6089 11.4501 20.4073 10.9733C21.2057 10.4965 22.2599 10.4965 23.0583 10.9733C23.1818 11.0437 23.2995 11.1215 23.4098 11.2057C23.1118 10.0264 22.2858 8.94278 21.0967 8.24316C19.9076 7.54354 18.4727 7.95435 17.7731 9.14343C17.0735 10.3325 17.4843 11.7675 18.6734 12.4671C19.1558 12.7538 19.699 12.9238 20.264 12.9238C20.6127 12.9238 20.9577 12.8596 21.2852 12.736C21.229 13.5684 21.4984 14.4172 22.046 15.0118C22.8444 15.8091 24.0322 16.071 25.0416 15.6562C25.0604 15.8208 25.0748 15.9877 25.0848 16.1563C25.1049 16.4959 25.1049 16.8396 25.0848 17.1792C24.7731 18.528 25.5332 19.897 26.8821 20.2087C27.0543 20.2529 27.2276 20.2762 27.4005 20.2762C28.0968 20.2762 28.7667 20.0847 29.344 19.733C31.5283 18.423 32.2285 15.753 30.9185 13.5687C30.8873 13.5161 30.8551 13.4646 30.822 13.4142C30.0768 12.4128 30.4836 10.9737 31.485 10.2285C32.4864 9.48328 33.9213 9.89001 34.6665 10.8914C35.4117 11.8929 35.005 13.3278 34.0035 14.073C33.978 14.0917 33.9521 14.1102 33.9257 14.1283C34.6543 17.1581 33.8242 20.4851 31.4721 22.942C29.1199 25.3988 25.7929 26.2289 22.7631 25.4995C22.7934 25.4158 22.8236 25.3321 22.8537 25.2483C22.046 24.321 21.5746 23.2327 21.464 22.0618C21.4586 21.9961 21.4542 21.9302 21.4509 21.8643C21.1897 21.5471 20.8932 21.2589 20.5694 21.0025C18.6657 19.5133 17.5332 17.8443 17.5332 16C17.5332 12.4503 20.4503 9.5332 24 9.5332C24.4418 9.5332 24.8727 9.58582 25.2862 9.68652C25.4859 10.6625 26.1779 11.4703 27.1833 11.7748C28.1887 12.0792 29.2724 11.6684 29.972 10.856C30.6716 10.0435 30.6716 8.82562 29.972 8.01318C29.2724 7.20073 28.1887 6.78992 27.1833 7.09434C26.7901 7.20911 26.4385 7.41016 26.1436 7.6748C25.459 7.15594 24.7431 6.82349 24 6.82349C18.932 6.82349 14.8235 10.932 14.8235 16C14.8235 21.068 18.932 25.1765 24 25.1765C24.7431 25.1765 25.459 24.844 26.1436 24.3252C27.7675 23.0645 28.8951 21.364 29.3512 19.4312C30.6557 19.1267 31.6917 18.0645 31.8152 16.7118C31.8471 16.3986 31.8471 16.0813 31.8152 15.7681C31.5108 13.0645 29.2712 11.0208 26.5676 11.0208C26.1685 11.0208 25.7779 11.0772 25.4073 11.1827C24.8727 10.2858 23.9531 9.68652 22.8951 9.5332C22.4284 10.4552 22.4284 11.6118 22.8951 12.5338C23.3618 13.4558 24.2862 14.0718 25.2862 14.2813C25.4073 14.5338 25.4735 14.8051 25.4735 15.0847C25.4735 16.4239 24.364 17.5332 23 17.5332C22.8314 17.5332 22.6657 17.5188 22.5024 17.4901C22.8624 18.9051 24.1672 19.9888 25.6882 19.9888C26.0443 19.9888 26.392 19.9324 26.7236 19.8239C27.9127 19.4312 28.7469 18.3524 28.7469 17.153C28.7469 16.8905 28.6943 16.6364 28.5917 16.3949C28.8471 16.3423 29.1024 16.3135 29.364 16.3135C30.6873 16.3135 31.7849 17.332 31.9185 18.6364C32.0917 20.3252 30.6568 21.8905 28.8951 22.3135C28.322 22.4558 27.7236 22.5332 27.1024 22.5332C25.2041 22.5332 23.4735 21.4943 22.5852 19.8824C23.0163 19.7817 23.4284 19.6118 23.7849 19.364C25.5332 18.1748 26.0284 15.8239 24.8392 14.0757C24.814 14.0402 24.7887 14.0051 24.7634 13.9701C24.4779 13.528 24 12.836 24 12.3428Z" fill="white"/>
    </svg>
)

export default function DailyStreakCard() {
    const { user } = useAuth();
    const { streakData, isLoading } = useStreak();

    // Memoize the calculation of the current week's days
    const weekDays = useMemo(() => {
        const now = new Date();
        // Assuming the week starts on Sunday (index 0)
        const weekStart = startOfWeek(now, { weekStartsOn: 0 });
        return eachDayOfWeek({ weekStartsOn: 0 }).map((day, index) => {
            // Re-map so Sunday is at the start (index 0)
            return startOfWeek(now, { weekStartsOn: index});
        });
    }, []);

    const weekDaysWithStatus = useMemo(() => {
        // Mock data for which days are complete. In a real app, this would come from user's activity log.
        const completedDays = [0, 2, 4]; // Example: Sun, Tue, Thu
        
        const now = new Date();
        const currentDayIndex = getDay(now); // Sunday is 0

        return weekDays.map((day, index) => {
            const isCompleted = isSameDay(day, now); // The current day is always marked as complete for this design
            return {
                dayChar: format(day, 'E').charAt(0),
                isCompleted: isCompleted,
                isToday: isSameDay(day, now)
            };
        });
    }, [weekDays]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <Skeleton className="h-48 w-full" />
                </div>
            )
        }
        
        if (!streakData) {
             return <p className="text-center text-white/70">Start a session to track your streak!</p>;
        }

        return (
            <div className="relative p-6 text-white w-full">
                {/* Pointer at the top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0
                  border-l-[10px] border-l-transparent
                  border-b-[10px] border-b-amber-600
                  border-r-[10px] border-r-transparent"
                />

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold">
                            {streakData.currentStreak} day streak
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                            You extended your streak before 51.9% of all learners yesterday!
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <FlameIcon />
                    </div>
                </div>

                <div className="mt-6 p-4 bg-black/25 rounded-xl">
                    <div className="flex justify-around">
                        {weekDaysWithStatus.map(({ dayChar, isCompleted }, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                                <span className="text-sm font-semibold text-white/70">{dayChar}</span>
                                <div className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                                    isCompleted ? "bg-amber-500" : "bg-white/20"
                                )}>
                                    {isCompleted && <Check className="h-5 w-5 text-white" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card className="bg-amber-600 border-amber-700 shadow-lg">
            <CardContent className="p-0">
                {renderContent()}
            </CardContent>
        </Card>
    );
}



'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { mockFriends, mockTeams } from "@/data/chat-data"
import { Users, MessageSquare } from "lucide-react";
import { Separator } from "../ui/separator";

const ChatAvatar = ({ user }: { user: (typeof mockFriends)[0] }) => {
    const statusColor = {
        online: 'bg-green-500',
        offline: 'bg-gray-500',
        'in-game': 'bg-yellow-500',
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative group">
                        <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-accent transition-colors duration-200">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColor[user.status]}`}></div>
                        {user.notification && (
                             <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-background"></div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="frosted-glass">
                    <p className="font-semibold">{user.name}</p>
                    <p className="capitalize text-muted-foreground">{user.status.replace('-', ' ')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const GroupIcon = ({ icon: Icon, name }: { icon: React.ElementType, name: string }) => (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="h-10 w-10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-muted-foreground/80" />
                </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="frosted-glass">
                <p>{name}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
)

export function ChatSidebar() {
    return (
        <aside className="fixed top-0 right-0 h-screen w-20 bg-background/50 backdrop-blur-md border-l border-border/30 z-40 hidden lg:flex flex-col items-center py-4 space-y-4">
            {/* Friends Section */}
            <div className="flex flex-col items-center space-y-4">
                <GroupIcon icon={Users} name="Friends Online" />
                {mockFriends.map(friend => (
                    <ChatAvatar key={friend.id} user={friend} />
                ))}
            </div>

            <Separator className="w-10/12 my-4 bg-border/50" />

            {/* Teams Section */}
            <div className="flex flex-col items-center space-y-4">
                <GroupIcon icon={MessageSquare} name="Teams" />
                {mockTeams.map(team => (
                    <ChatAvatar key={team.id} user={team} />
                ))}
            </div>
        </aside>
    )
}

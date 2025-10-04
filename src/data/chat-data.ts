
export const mockFriends = [
    { id: '1', name: 'Alex', avatarUrl: 'https://placehold.co/64x64/FFC107/FFFFFF/png?text=A', status: 'online' as const, notification: true },
    { id: '2', name: 'Beth', avatarUrl: 'https://placehold.co/64x64/E91E63/FFFFFF/png?text=B', status: 'in-game' as const },
    { id: '3', name: 'Charlie', avatarUrl: 'https://placehold.co/64x64/4CAF50/FFFFFF/png?text=C', status: 'online' as const },
    { id: '4', name: 'Diana', avatarUrl: 'https://placehold.co/64x64/2196F3/FFFFFF/png?text=D', status: 'offline' as const, notification: false },
    { id: '5', name: 'Ethan', avatarUrl: 'https://placehold.co/64x64/9C27B0/FFFFFF/png?text=E', status: 'online' as const },
];

export const mockTeams = [
    { id: 't1', name: 'Project Alpha Team', avatarUrl: 'https://placehold.co/64x64/F44336/FFFFFF/png?text=PA', status: 'online' as const, notification: true },
    { id: 't2', name: 'Study Group', avatarUrl: 'https://placehold.co/64x64/00BCD4/FFFFFF/png?text=SG', status: 'offline' as const },
    { id: 't3', name: 'Gaming Squad', avatarUrl: 'https://placehold.co/64x64/FF9800/FFFFFF/png?text=GS', status: 'in-game' as const },
];

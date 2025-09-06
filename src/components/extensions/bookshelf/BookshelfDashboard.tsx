
'use client';
import { Card } from "@/components/ui/card";
import { Book, PlusCircle } from "lucide-react";

// Mock data for demonstration purposes
const mockShelves = [
    { 
        name: 'Currently Reading', 
        books: [
            { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', coverUrl: 'https://placehold.co/150x220.png?text=Designing+Data' },
            { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', coverUrl: 'https://placehold.co/150x220.png?text=Pragmatic' },
        ]
    },
    {
        name: 'Want to Read',
        books: [
            { title: 'Clean Architecture', author: 'Robert C. Martin', coverUrl: 'https://placehold.co/150x220.png?text=Clean+Arch' },
            { title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson', coverUrl: 'https://placehold.co/150x220.png?text=SICP' },
            { title: 'Code: The Hidden Language', author: 'Charles Petzold', coverUrl: 'https://placehold.co/150x220.png?text=Code' },
        ]
    },
    {
        name: 'Finished',
        books: []
    }
];

const AddBookCard = () => (
    <div className="group relative w-[150px] h-[220px] flex-shrink-0 bg-black/10 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-accent transition-colors cursor-pointer">
        <PlusCircle className="h-10 w-10 text-white/40 group-hover:text-accent transition-colors" />
        <p className="text-sm text-white/60 mt-2">Add Book</p>
    </div>
);

const BookCard = ({ title, coverUrl }: { title: string, coverUrl: string }) => (
    <div className="group relative w-[150px] h-[220px] flex-shrink-0">
        <img src={coverUrl} alt={title} className="w-full h-full object-cover rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
            <p className="text-white text-center text-sm font-bold">{title}</p>
        </div>
    </div>
);


export default function BookshelfDashboard() {

    const woodBgStyle = {
        backgroundImage: 'url(https://www.transparenttextures.com/patterns/wood-pattern.png), linear-gradient(to bottom right, #6b4a2f, #4a2d1a)',
        backgroundBlendMode: 'overlay',
        backgroundColor: '#583A24',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={woodBgStyle}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-headline text-white/90 drop-shadow-md flex items-center gap-3">
                        <Book className="h-8 w-8"/>
                        Book Shelf
                    </h1>
                    <p className="text-white/70 mt-1">Your personal library and reading tracker.</p>
                </div>

                <div className="space-y-12">
                    {mockShelves.map(shelf => (
                        <div key={shelf.name}>
                            <h2 className="text-2xl font-semibold text-white/80 mb-4 pb-2 border-b-2 border-white/10">{shelf.name}</h2>
                            <div className="relative">
                                {/* The glass panel */}
                                <div className="absolute inset-x-0 top-[-10px] bottom-[-10px] bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-inner"></div>
                                {/* The shelf content */}
                                <div className="relative flex items-center gap-6 p-6 overflow-x-auto">
                                    {shelf.books.map((book, index) => (
                                        <BookCard key={index} title={book.title} coverUrl={book.coverUrl} />
                                    ))}
                                    <AddBookCard />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

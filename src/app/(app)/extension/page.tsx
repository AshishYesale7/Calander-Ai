
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

// --- Mock Data ---
// In a real application, this would come from a database or API.
const allPlugins = [
  { 
    name: 'Android Studio', 
    logo: '/logos/android-studio.svg',
    description: 'The official IDE for Android app development.'
  },
  { 
    name: 'AppCode', 
    logo: '/logos/appcode.svg',
    description: 'Smart IDE for iOS/macOS development by JetBrains.'
  },
  { 
    name: 'Chrome', 
    logo: '/logos/chrome.svg',
    description: 'Google\'s web browser for a fast, secure experience.'
  },
  { 
    name: 'Figma', 
    logo: '/logos/figma.svg',
    description: 'The collaborative interface design tool.'
  },
  { 
    name: 'VS Code', 
    logo: '/logos/vscode.svg',
    description: 'A powerful, lightweight source code editor.'
  },
  { 
    name: 'Blender', 
    logo: '/logos/blender.svg',
    description: 'Free and open source 3D creation suite.'
  },
  { 
    name: 'Azure Data Studio', 
    logo: '/logos/azure-data-studio.svg',
    description: 'Cross-platform database tool for data professionals.'
  },
  { 
    name: 'Brave', 
    logo: '/logos/brave.svg',
    description: 'A privacy-focused browser that blocks ads and trackers.'
  },
  { 
    name: 'Canva', 
    logo: '/logos/canva.svg',
    description: 'Online design platform for creating visual content.'
  },
  { 
    name: 'CLion', 
    logo: '/logos/clion.svg',
    description: 'A cross-platform IDE for C and C++ by JetBrains.'
  },
  { 
    name: 'Discord', 
    logo: '/logos/discord.svg',
    description: 'All-in-one voice and text chat for gamers.'
  },
  { 
    name: 'Eclipse', 
    logo: '/logos/eclipse.svg',
    description: 'An IDE for Java and other programming languages.'
  },
  { 
    name: 'DataGrip', 
    logo: '/logos/datagrip.svg',
    description: 'The cross-platform IDE for databases & SQL.'
  },
  { 
    name: 'DataSpell', 
    logo: '/logos/dataspell.svg',
    description: 'The IDE for professional data scientists.'
  },
  { 
    name: 'DBeaver', 
    logo: '/logos/dbeaver.svg',
    description: 'Free multi-platform universal database tool.'
  },
  { 
    name: 'Delphi', 
    logo: '/logos/delphi.svg',
    description: 'IDE for rapid application development.'
  },
];
// --- End Mock Data ---

type Plugin = (typeof allPlugins)[0];

interface FullScreenPluginViewProps {
  plugin: Plugin;
  onClose: () => void;
}

const FullScreenPluginView: React.FC<FullScreenPluginViewProps> = ({ plugin, onClose }) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in fade-in duration-300">
      <header className="p-4 border-b border-border/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Image src={plugin.logo} alt={`${plugin.name} logo`} width={32} height={32} />
          <h2 className="text-xl font-semibold">{plugin.name}</h2>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close Extension
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">This is the {plugin.name} Extension</h1>
          <p className="text-muted-foreground mt-2">This area would contain the full-screen UI for the extension.</p>
        </div>
      </main>
    </div>
  );
};


export default function ExtensionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set(['VS Code']));
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);

  const filteredPlugins = allPlugins.filter((plugin) =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleInstall = (pluginName: string) => {
    setInstalledPlugins((prev) => new Set(prev).add(pluginName));
  };
  
  const handleOpen = (plugin: Plugin) => {
    setActivePlugin(plugin);
  };

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold font-headline text-primary">Plugins</h1>
        <p className="mt-4 text-lg text-foreground/80">
          Open source plugins for automatic programming metrics.
          Already have the plugin? View your <a href="#" className="text-accent hover:underline">plugins status</a> or <a href="#" className="text-accent hover:underline">get help</a>.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 h-12 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {filteredPlugins.map((plugin) => {
            const isInstalled = installedPlugins.has(plugin.name);
            return (
                 <div key={plugin.name} className="group flex flex-col items-center gap-3 text-center">
                    <div className="relative w-24 h-24 rounded-2xl bg-card p-4 border border-border/30 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-accent/20 group-hover:shadow-lg group-hover:border-accent/40">
                         <Image
                            src={plugin.logo}
                            alt={`${plugin.name} logo`}
                            width={80}
                            height={80}
                            className="w-full h-full object-contain"
                          />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-sm text-foreground">{plugin.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 h-8 line-clamp-2">{plugin.description}</p>
                        {isInstalled ? (
                             <Button variant="outline" size="sm" className="mt-2 h-7 px-3 text-xs" onClick={() => handleOpen(plugin)}>
                                <ExternalLink className="h-3 w-3 mr-1.5"/> Open
                            </Button>
                        ) : (
                             <Button variant="default" size="sm" className="mt-2 h-7 px-3 text-xs bg-accent hover:bg-accent/90" onClick={() => handleInstall(plugin.name)}>
                                <Download className="h-3 w-3 mr-1.5"/> Install
                            </Button>
                        )}
                    </div>
                </div>
            )
        })}
      </div>
      
      {activePlugin && (
        <FullScreenPluginView 
          plugin={activePlugin} 
          onClose={() => setActivePlugin(null)} 
        />
      )}
    </div>
  );
}


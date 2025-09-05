
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ExternalLink, Code } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import CodefolioDashboard from '@/components/extensions/codefolio/CodefolioDashboard';
import CodefolioLogin from '@/components/extensions/codefolio/CodefolioLogin';
import type { AllPlatformsUserData } from '@/ai/flows/fetch-coding-stats-flow';
import { useAuth } from '@/context/AuthContext';
import { getCodingUsernames, saveCodingUsernames } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// --- Mock Data ---
// In a real application, this would come from a database or API.
const allPlugins = [
  { 
    name: 'Codefolio Ally', 
    logo: '/logos/codefolio-logo.svg',
    component: CodefolioDashboard // This will be conditionally rendered
  },
  { 
    name: 'Android Studio', 
    logo: 'https://worldvectorlogo.com/logos/android-studio-1.svg',
    description: 'The official IDE for Android app development.'
  },
  { 
    name: 'AppCode', 
    logo: 'https://worldvectorlogo.com/logos/appcode.svg',
    description: 'Smart IDE for iOS/macOS development by JetBrains.'
  },
  { 
    name: 'Chrome', 
    logo: 'https://worldvectorlogo.com/logos/chrome.svg',
    description: 'Google\'s web browser for a fast, secure experience.'
  },
  { 
    name: 'Figma', 
    logo: 'https://worldvectorlogo.com/logos/figma-1.svg',
    description: 'The collaborative interface design tool.'
  },
  { 
    name: 'VS Code', 
    logo: 'https://worldvectorlogo.com/logos/visual-studio-code-1.svg',
    description: 'A powerful, lightweight source code editor.'
  },
  { 
    name: 'Blender', 
    logo: 'https://worldvectorlogo.com/logos/blender-2.svg',
    description: 'Free and open source 3D creation suite.'
  },
];
// --- End Mock Data ---

type Plugin = (typeof allPlugins)[0];

interface FullScreenPluginViewProps {
  plugin: Plugin;
  onClose: () => void;
  onLogout: () => void;
  userData: AllPlatformsUserData | null;
}

const FullScreenPluginView: React.FC<FullScreenPluginViewProps> = ({ plugin, onClose, userData, onLogout }) => {
  const PluginComponent = plugin.component;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-300">
      <header className="p-2 border-b border-border/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 ml-2">
          {plugin.logo.startsWith('/') ? (
             <Code className="h-7 w-7 text-accent" />
          ) : (
             <Image src={plugin.logo} alt={`${plugin.name} logo`} width={28} height={28} />
          )}
          <h2 className="text-xl font-semibold">{plugin.name}</h2>
        </div>
        <div>
            <Button variant="ghost" onClick={onLogout}>Logout</Button>
            <Button variant="outline" onClick={onClose}>
                Close Extension
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {PluginComponent && userData ? <CodefolioDashboard userData={userData} /> : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold">This is the {plugin.name} Extension</h1>
                <p className="text-muted-foreground mt-2">This area would contain the full-screen UI for the extension.</p>
              </div>
            </div>
        )}
      </main>
    </div>
  );
};


export default function ExtensionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set(['VS Code', 'Codefolio Ally']));
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);

  // New state for Codefolio Ally
  const [isCodefolioLoggedIn, setIsCodefolioLoggedIn] = useState(false);
  const [codefolioUserData, setCodefolioUserData] = useState<AllPlatformsUserData | null>(null);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  useEffect(() => {
    if (user) {
        setIsCheckingLogin(true);
        getCodingUsernames(user.uid).then(data => {
            const hasUsernames = data && Object.values(data).some(v => v);
            if (hasUsernames) {
                // If usernames are present, we consider the user "logged in".
                // The dashboard component will be responsible for fetching the actual stats.
                setIsCodefolioLoggedIn(true);
                setCodefolioUserData({} as AllPlatformsUserData); 
            } else {
                setIsCodefolioLoggedIn(false);
            }
        }).catch(err => {
            console.error("Failed to check login status:", err);
            setIsCodefolioLoggedIn(false);
        }).finally(() => setIsCheckingLogin(false));
    } else {
        setIsCheckingLogin(false);
    }
  }, [user]);

  const handleInstall = (pluginName: string) => {
    setInstalledPlugins((prev) => new Set(prev).add(pluginName));
  };
  
  const handleOpen = (plugin: Plugin) => {
    if (plugin.name === 'Codefolio Ally') {
        if (!isCodefolioLoggedIn) {
            // Show login screen if not logged in
            setActivePlugin({ name: 'CodefolioLogin', component: CodefolioLogin } as any);
        } else {
            setActivePlugin(plugin);
        }
    } else {
        setActivePlugin(plugin);
    }
  };

  const handleCodefolioLogin = (data: AllPlatformsUserData) => {
      if (!user) {
        toast({ title: "Error", description: "You must be signed in to save usernames.", variant: "destructive" });
        return;
      }
      const usernamesToSave = {
          codeforces: data.codeforces?.username,
          leetcode: data.leetcode?.username,
          codechef: data.codechef?.username,
      };

      // Filter out any undefined usernames before saving
      const definedUsernames = Object.fromEntries(
        Object.entries(usernamesToSave).filter(([, value]) => value !== undefined)
      );

      saveCodingUsernames(user.uid, definedUsernames).then(() => {
          setIsCodefolioLoggedIn(true);
          setCodefolioUserData(data);
          setActivePlugin(allPlugins.find(p => p.name === 'Codefolio Ally')!);
          toast({ title: "Success", description: "Usernames saved and data fetched!" });
      }).catch(err => {
          toast({ title: "Error", description: `Could not save usernames: ${err.message}`, variant: "destructive" });
      });
  };
  
  const handleCodefolioLogout = () => {
    if (!user) return;
    saveCodingUsernames(user.uid, {}).then(() => {
      setIsCodefolioLoggedIn(false);
      setCodefolioUserData(null);
      setActivePlugin(null);
      toast({ title: "Logged Out", description: "Your coding platform usernames have been cleared." });
    });
  };

  const filteredPlugins = allPlugins.filter((plugin) =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      <Card className="frosted-glass p-4 md:p-8">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {filteredPlugins.map((plugin) => {
                const isInstalled = installedPlugins.has(plugin.name);
                const isCodefolio = plugin.name === 'Codefolio Ally';
                
                return (
                    <div key={plugin.name} className="group flex flex-col items-center gap-3 text-center">
                        <div className="relative w-24 h-24 rounded-2xl bg-card p-4 border border-border/30 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-accent/20 group-hover:shadow-lg group-hover:border-accent/40 flex items-center justify-center">
                           {plugin.logo.startsWith('/') ? (
                             <Code className="h-12 w-12 text-accent" />
                            ) : (
                                <Image
                                    src={plugin.logo}
                                    alt={`${plugin.name} logo`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-sm text-foreground">{plugin.name}</p>
                            <p className="text-xs text-muted-foreground mt-1 h-8 line-clamp-2">{plugin.description}</p>
                            
                            {isCheckingLogin && isCodefolio ? (
                                <Button disabled variant="outline" size="sm" className="mt-2 h-7 px-3 text-xs">
                                    <LoadingSpinner size="sm" />
                                </Button>
                            ) : isInstalled ? (
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
        </CardContent>
      </Card>
      
      {activePlugin && activePlugin.name === 'CodefolioLogin' && (
         <CodefolioLogin
          onLoginSuccess={handleCodefolioLogin}
          onClose={() => setActivePlugin(null)}
        />
      )}

      {activePlugin && activePlugin.name === 'Codefolio Ally' && (
        <FullScreenPluginView 
          plugin={activePlugin} 
          onClose={() => setActivePlugin(null)}
          onLogout={handleCodefolioLogout}
          userData={codefolioUserData}
        />
      )}
    </div>
  );
}

    

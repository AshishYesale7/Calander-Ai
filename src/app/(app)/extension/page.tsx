
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ExternalLink, Code, Settings, CheckCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CodefolioDashboard from '@/components/extensions/codefolio/CodefolioDashboard';
import CodefolioLogin from '@/components/extensions/codefolio/CodefolioLogin';
import type { AllPlatformsUserData } from '@/ai/flows/fetch-coding-stats-flow';
import { useAuth } from '@/context/AuthContext';
import { getCodingUsernames, saveCodingUsernames, getInstalledPlugins, saveInstalledPlugins } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import { allPlugins } from '@/data/plugins';

type Plugin = (typeof allPlugins)[0];

const DEFAULT_PLUGINS = ['VS Code', 'Codefolio Ally', 'Discord'];

interface FullScreenPluginViewProps {
  plugin: Plugin;
  onClose: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

const FullScreenPluginView: React.FC<FullScreenPluginViewProps> = ({ plugin, onClose, onLogout, onSettings }) => {
  const PluginComponent = plugin.component;
  const isCodefolio = plugin.name === 'Codefolio Ally';

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
        <div className="flex items-center gap-2">
            {isCodefolio && <Button variant="ghost" onClick={onSettings}><Settings className="mr-2 h-4 w-4"/>Settings</Button>}
            {isCodefolio && <Button variant="ghost" onClick={onLogout}>Logout</Button>}
            <Button variant="outline" onClick={onClose}>
                Close Extension
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {PluginComponent ? <CodefolioDashboard /> : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <h1 className="text-4xl font-bold font-headline text-primary">This is the {plugin.name} Extension</h1>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">This area is a placeholder to demonstrate where the full-screen user interface for the '{plugin.name}' extension would be displayed.</p>
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
  const [installedPluginsSet, setInstalledPluginsSet] = useState<Set<string>>(new Set());
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);

  // New state for Codefolio Ally
  const [isCodefolioLoggedIn, setIsCodefolioLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  // Fetch installed plugins from Firestore on mount
  useEffect(() => {
    if (user) {
      getInstalledPlugins(user.uid).then(plugins => {
        if (plugins !== null) { // If it's not null, a record exists (even if empty)
          setInstalledPluginsSet(new Set(plugins));
        } else {
          // If user has no saved plugins record at all (is a new user), set the defaults
          const defaultSet = new Set(DEFAULT_PLUGINS);
          setInstalledPluginsSet(defaultSet);
          // And save these defaults to their new profile
          saveInstalledPlugins(user.uid, Array.from(defaultSet));
        }
      }).catch(err => {
        console.error("Failed to load plugins from Firestore", err);
        toast({ title: "Error", description: "Could not load your installed plugins.", variant: "destructive"});
        // Fallback to defaults on error
        setInstalledPluginsSet(new Set(DEFAULT_PLUGINS));
      });
    }
  }, [user, toast]);
  
  const updateInstalledPlugins = useCallback((newSet: Set<string>) => {
      setInstalledPluginsSet(newSet);
      if (user) {
          saveInstalledPlugins(user.uid, Array.from(newSet)).catch(err => {
              toast({ title: "Sync Error", description: "Could not save your plugin changes to the cloud.", variant: "destructive" });
          });
      }
  }, [user, toast]);

  const handleInstall = (pluginName: string) => {
    const newSet = new Set(installedPluginsSet);
    newSet.add(pluginName);
    updateInstalledPlugins(newSet);
  };
  
  const handleUninstall = (pluginName: string) => {
    const newSet = new Set(installedPluginsSet);
    newSet.delete(pluginName);
    updateInstalledPlugins(newSet);
  };

  useEffect(() => {
    if (user) {
        setIsCheckingLogin(true);
        getCodingUsernames(user.uid).then(data => {
            const hasUsernames = data && Object.values(data).some(v => v);
            if (hasUsernames) {
                setIsCodefolioLoggedIn(true);
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
        Object.entries(usernamesToSave).filter(([, value]) => value !== undefined && value !== null)
      );

      saveCodingUsernames(user.uid, definedUsernames).then(() => {
          setIsCodefolioLoggedIn(true);
          setActivePlugin(allPlugins.find(p => p.name === 'Codefolio Ally')!);
          toast({ title: "Success", description: "Usernames saved and data fetched!" });
      }).catch(err => {
          toast({ title: "Error", description: `Could not save usernames: ${err.message}`, variant: "destructive" });
      });
  };

  const handleCodefolioLogout = () => {
    if (!user) return;
    saveCodingUsernames(user.uid, {
        codeforces: undefined,
        leetcode: undefined,
        codechef: undefined,
    }).then(() => {
      setIsCodefolioLoggedIn(false);
      setActivePlugin(null);
      toast({ title: "Logged Out", description: "Your coding platform usernames have been cleared." });
    });
  };
  
  const handleSettings = () => {
    setActivePlugin({ name: 'CodefolioLogin', component: CodefolioLogin } as any);
  };

  const { installedList, marketplaceList } = useMemo(() => {
    const installed = allPlugins.filter(plugin => 
        installedPluginsSet.has(plugin.name) && 
        plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const marketplace = allPlugins.filter(plugin => 
        !installedPluginsSet.has(plugin.name) &&
        plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { installedList: installed, marketplaceList: marketplace };
  }, [searchTerm, installedPluginsSet]);


  const PluginCardItem = ({ plugin }: { plugin: Plugin }) => {
    const isInstalled = installedPluginsSet.has(plugin.name);
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
                    <div className="flex items-center justify-center gap-1 mt-2">
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => handleOpen(plugin)}>
                            <ExternalLink className="h-3 w-3 mr-1.5"/> Open
                        </Button>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleUninstall(plugin.name)}>
                            <Trash2 className="h-3 w-3"/>
                        </Button>
                    </div>
                ) : (
                    <Button variant="default" size="sm" className="mt-2 h-7 px-3 text-xs bg-accent hover:bg-accent/90" onClick={() => handleInstall(plugin.name)}>
                        <Download className="h-3 w-3 mr-1.5"/> Install
                    </Button>
                )}
            </div>
        </div>
    );
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
            placeholder="Search all plugins..."
            className="pl-10 h-12 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

       <Card className="frosted-glass p-4 md:p-8">
        <CardHeader className="p-0 pb-6">
            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-400"/>
                Installed Plugins
            </CardTitle>
            <CardDescription>Plugins that are currently active in your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {installedList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {installedList.map((plugin) => <PluginCardItem key={plugin.name} plugin={plugin} />)}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <p>No installed plugins match your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="frosted-glass p-4 md:p-8">
        <CardHeader className="p-0 pb-6">
            <CardTitle className="font-headline text-2xl text-primary">Marketplace</CardTitle>
            <CardDescription>Discover new plugins to enhance your productivity.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {marketplaceList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {marketplaceList.map((plugin) => <PluginCardItem key={plugin.name} plugin={plugin} />)}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <p>No available plugins match your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {activePlugin && activePlugin.name === 'CodefolioLogin' && (
         <CodefolioLogin
          onLoginSuccess={handleCodefolioLogin}
          onClose={() => setActivePlugin(null)}
        />
      )}

      {activePlugin && activePlugin.name !== 'CodefolioLogin' && (
        <FullScreenPluginView
          plugin={activePlugin}
          onClose={() => setActivePlugin(null)}
          onLogout={handleCodefolioLogout}
          onSettings={handleSettings}
        />
      )}
    </div>
  );
}

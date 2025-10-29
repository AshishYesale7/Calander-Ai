
'use client';

import { allPlugins } from '@/data/plugins';
import { Button } from '../ui/button';
import Image from 'next/image';

interface ExtensionsPopoverContentProps {
    installedPlugins: (typeof allPlugins);
    onPluginClick: (plugin: (typeof allPlugins)[0]) => void;
}

export default function ExtensionsPopoverContent({ installedPlugins, onPluginClick }: ExtensionsPopoverContentProps) {
    return (
        <div className="space-y-4">
            <h4 className="font-medium leading-none">Installed Plugins</h4>
            <div className="space-y-2">
                {installedPlugins.length > 0 ? (
                    installedPlugins.map(plugin => {
                        const LogoComponent = plugin.logo;
                        return (
                            <button 
                                key={plugin.name}
                                onClick={() => onPluginClick(plugin)}
                                className="w-full flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted"
                            >
                                {typeof LogoComponent === 'string' ? (
                                    <Image src={LogoComponent} alt={`${plugin.name} logo`} width={20} height={20} />
                                ) : (
                                    <LogoComponent className="h-5 w-5" />
                                )}
                                <span>{plugin.name}</span>
                            </button>
                        )
                    })
                ) : (
                    <p className="text-sm text-muted-foreground">No plugins installed.</p>
                )}
            </div>
            <Button variant="outline" className="w-full" asChild>
                <a href="/extension">Manage Plugins</a>
            </Button>
        </div>
    )
}

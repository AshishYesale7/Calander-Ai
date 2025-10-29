
'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { ImageUp, Link, Trash2, Palette, Slash, Paintbrush, Text, Sparkles, Box, Droplets, Layers, Video } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { GlassEffect } from '@/context/ThemeContext';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/context/AuthContext';
import { deleteLayout } from '@/services/layoutService'; // Import the new service

interface CustomizeThemeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const themeColorConfig = [
  { id: 'background', label: 'Background', icon: Paintbrush, cssVar: '--background' },
  { id: 'foreground', label: 'Foreground Text', icon: Text, cssVar: '--foreground' },
  { id: 'card', label: 'Card Background', icon: Paintbrush, cssVar: '--card' },
  { id: 'primary', label: 'Primary (Headings)', icon: Sparkles, cssVar: '--primary' },
  { id: 'accent', label: 'Accent (Buttons)', icon: Sparkles, cssVar: '--accent' },
];

const glassEffectConfig: {id: GlassEffect, label: string, icon: React.ElementType, description: string}[] = [
    { id: 'grainyFrosted', label: 'Grainy Frosted', icon: Layers, description: 'A subtle, textured glass with a noise overlay.' },
    { id: 'frosted', label: 'Frosted Glass', icon: Box, description: 'A classic translucent, blurred effect.' },
    { id: 'water-droplets', label: 'Water Droplets', icon: Droplets, description: 'A textured, dynamic water droplet effect.' },
    { id: 'subtle-shadow', label: 'Subtle Shadow', icon: Box, description: 'A clean look with soft shadows instead of glass.' },
];


export default function CustomizeThemeModal({ isOpen, onOpenChange }: CustomizeThemeModalProps) {
  const { 
    setBackgroundImage,
    setBackgroundVideo,
    backgroundColor: currentBackgroundColor,
    setBackgroundColor, 
    customTheme,
    setCustomTheme,
    resetCustomizations,
    theme: currentThemeMode,
    isMounted,
    glassEffect,
    setGlassEffect,
    glassEffectSettings,
    setGlassEffectSettings,
  } = useTheme();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialThemeValues, setInitialThemeValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && isMounted) {
      const rootStyle = getComputedStyle(document.documentElement);
      const initialValues: Record<string, string> = {};
      themeColorConfig.forEach(config => {
        initialValues[config.cssVar] = rootStyle.getPropertyValue(config.cssVar).trim();
      });
      setInitialThemeValues(initialValues);
    }
  }, [isOpen, isMounted, currentThemeMode]);

  const handleUrlApply = () => {
    if (!imageUrl.trim()) {
      toast({ title: 'Error', description: 'Please enter an image URL.', variant: 'destructive' });
      return;
    }
    try {
      new URL(imageUrl);
      setBackgroundImage(imageUrl);
      toast({ title: 'Success', description: 'Background image updated from URL.' });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid image URL.', variant: 'destructive' });
    }
  };

  const handleVideoUrlApply = () => {
    if (!videoUrl.trim()) {
        toast({ title: 'Error', description: 'Please enter a video URL.', variant: 'destructive' });
        return;
    }
    try {
        new URL(videoUrl);
        setBackgroundVideo(videoUrl);
        toast({ title: 'Success', description: 'Background video updated.' });
        onOpenChange(false);
        resetForm();
    } catch (error) {
        toast({ title: 'Error', description: 'Invalid video URL.', variant: 'destructive' });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // Increased limit for videos
        toast({ title: 'Error', description: 'File size exceeds 100MB limit.', variant: 'destructive' });
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadApply = () => {
    if (previewUrl && uploadedFile) {
      if (uploadedFile.type.startsWith('video/')) {
        setBackgroundVideo(previewUrl);
        toast({ title: 'Success', description: 'Background video uploaded.' });
      } else {
        setBackgroundImage(previewUrl);
        toast({ title: 'Success', description: 'Background image uploaded.' });
      }
      onOpenChange(false);
      resetForm();
    }
  };

  const handleReset = async () => {
    resetCustomizations();
    
    if (user) {
      const role = user.userType || 'student';
      // Clear the role-specific layout from both local storage and Firestore
      const layoutKey = `dashboard-layouts-${user.uid}-${role}`;
      localStorage.removeItem(layoutKey);
      await deleteLayout(user.uid, role);
    }
    
    toast({ title: 'Success', description: 'Theme and layout have been reset to default. Reloading...' });
    setTimeout(() => window.location.reload(), 1500); // Reload to apply default layout
    onOpenChange(false);
    resetForm();
  };

  const handleColorChange = (cssVar: string, colorString: string) => {
    setCustomTheme({
      ...customTheme,
      [cssVar]: colorString,
    });
  };

  const getCurrentColor = (cssVar: string): string => {
    if (customTheme && customTheme[cssVar]) {
      return customTheme[cssVar];
    }
    return initialThemeValues[cssVar] || '#000000';
  };

  const handleBackgroundColorSelect = (colorValue: string | null) => {
    setBackgroundColor(colorValue);
  };

  const resetForm = () => {
    setImageUrl('');
    setVideoUrl('');
    setUploadedFile(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById('background-file-upload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };
  
  const handleModalOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 border-b border-border/30">
          <DialogTitle className="font-headline text-lg text-primary">Customize Theme</DialogTitle>
          <DialogDescription className="text-sm">
            Personalize your app's appearance. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
          <div className="space-y-3">
              <Label className="font-semibold text-base flex items-center text-primary">
                  <Droplets className="mr-2 h-4 w-4" /> Glass & Card Style
              </Label>
              <RadioGroup 
                  value={glassEffect} 
                  onValueChange={(value) => setGlassEffect(value as GlassEffect)}
                  className="space-y-1"
              >
                  {glassEffectConfig.map(effect => (
                      <div key={effect.id} className="rounded-lg border has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:bg-accent/10 transition-colors">
                        <Label htmlFor={effect.id} className="flex items-center space-x-3 p-3  hover:bg-muted/50 cursor-pointer">
                            <RadioGroupItem value={effect.id} id={effect.id} />
                            <div className="flex-1">
                                <p className="font-medium text-sm flex items-center">{effect.label}</p>
                                <p className="text-xs text-muted-foreground">{effect.description}</p>
                            </div>
                        </Label>
                        {glassEffect === effect.id && (
                          <div className="pt-1 pb-3 px-4 space-y-3 border-t border-accent/20">
                            {effect.id === 'grainyFrosted' && (
                               <div className="space-y-3">
                                 <div className="grid gap-1">
                                     <div className="flex justify-between items-center"><Label htmlFor="gf-blur" className="text-xs">Blur</Label><span className="text-xs text-muted-foreground">{glassEffectSettings.grainyFrosted.blur}px</span></div>
                                     <Slider id="gf-blur" min={0} max={40} step={1} value={[glassEffectSettings.grainyFrosted.blur]} onValueChange={([v]) => setGlassEffectSettings({...glassEffectSettings, grainyFrosted: {...glassEffectSettings.grainyFrosted, blur: v}})} />
                                 </div>
                                 <div className="grid gap-1">
                                     <div className="flex justify-between items-center"><Label htmlFor="gf-noise" className="text-xs">Noise Opacity</Label><span className="text-xs text-muted-foreground">{Math.round(glassEffectSettings.grainyFrosted.noiseOpacity * 100)}%</span></div>
                                     <Slider id="gf-noise" min={0} max={1} step={0.01} value={[glassEffectSettings.grainyFrosted.noiseOpacity]} onValueChange={([v]) => setGlassEffectSettings({...glassEffectSettings, grainyFrosted: {...glassEffectSettings.grainyFrosted, noiseOpacity: v}})} />
                                 </div>
                               </div>
                            )}
                            {effect.id === 'frosted' && (
                               <div className="grid gap-1">
                                  <div className="flex justify-between items-center">
                                      <Label htmlFor="frosted-blur" className="text-xs">Blur</Label>
                                      <span className="text-xs text-muted-foreground">{glassEffectSettings.frosted.blur}px</span>
                                  </div>
                                  <Slider id="frosted-blur" min={0} max={40} step={1} value={[glassEffectSettings.frosted.blur]} onValueChange={([value]) => setGlassEffectSettings({ ...glassEffectSettings, frosted: { ...glassEffectSettings.frosted, blur: value } })} />
                              </div>
                            )}
                             {effect.id === 'water-droplets' && (
                              <div className="space-y-3">
                                <div className="grid gap-1">
                                    <div className="flex justify-between items-center"><Label htmlFor="wd-blur" className="text-xs">Blur</Label><span className="text-xs text-muted-foreground">{glassEffectSettings.waterDroplets.blur}px</span></div>
                                    <Slider id="wd-blur" min={0} max={20} step={1} value={[glassEffectSettings.waterDroplets.blur]} onValueChange={([v]) => setGlassEffectSettings({...glassEffectSettings, waterDroplets: {...glassEffectSettings.waterDroplets, blur: v}})} />
                                </div>
                                <div className="grid gap-1">
                                    <div className="flex justify-between items-center"><Label htmlFor="wd-saturate" className="text-xs">Saturate</Label><span className="text-xs text-muted-foreground">{glassEffectSettings.waterDroplets.saturate}%</span></div>
                                    <Slider id="wd-saturate" min={100} max={200} step={5} value={[glassEffectSettings.waterDroplets.saturate]} onValueChange={([v]) => setGlassEffectSettings({...glassEffectSettings, waterDroplets: {...glassEffectSettings.waterDroplets, saturate: v}})} />
                                </div>
                                 <div className="grid gap-1">
                                    <div className="flex justify-between items-center"><Label htmlFor="wd-brightness" className="text-xs">Brightness</Label><span className="text-xs text-muted-foreground">{glassEffectSettings.waterDroplets.brightness}%</span></div>
                                    <Slider id="wd-brightness" min={50} max={150} step={5} value={[glassEffectSettings.waterDroplets.brightness]} onValueChange={([v]) => setGlassEffectSettings({...glassEffectSettings, waterDroplets: {...glassEffectSettings.waterDroplets, brightness: v}})} />
                                </div>
                              </div>
                            )}
                             {effect.id === 'subtle-shadow' && (
                               <div className="grid gap-1">
                                  <div className="flex justify-between items-center">
                                      <Label htmlFor="ss-opacity" className="text-xs">Shadow Opacity</Label>
                                      <span className="text-xs text-muted-foreground">{Math.round(glassEffectSettings.subtleShadow.opacity * 100)}%</span>
                                  </div>
                                  <Slider id="ss-opacity" min={0} max={1} step={0.05} value={[glassEffectSettings.subtleShadow.opacity]} onValueChange={([value]) => setGlassEffectSettings({ ...glassEffectSettings, subtleShadow: { ...glassEffectSettings.subtleShadow, opacity: value } })} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                  ))}
              </RadioGroup>
          </div>

          <Separator />

          {/* Theme Color Customization */}
          <div className="space-y-3">
             <Label className="font-semibold text-base flex items-center text-primary">
                <Palette className="mr-2 h-4 w-4" /> Theme Colors
            </Label>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3">
              {themeColorConfig.map(config => (
                <div key={config.id} className="flex items-center justify-between">
                  <Label htmlFor={`color-${config.id}`} className="flex items-center gap-2 text-sm">
                    <config.icon className="h-4 w-4 text-muted-foreground" />
                    {config.label}
                  </Label>
                  <ColorPickerPopover 
                    id={`color-${config.id}`}
                    value={getCurrentColor(config.cssVar)} 
                    onChange={(colorString) => handleColorChange(config.cssVar, colorString)} 
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <Label className="font-semibold text-base flex items-center text-primary">
              <ImageUp className="mr-2 h-4 w-4" /> Background
            </Label>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm flex items-center">
                <Link className="mr-2 h-4 w-4" /> Image URL
              </Label>
              <div className="flex space-x-2">
                <Input id="imageUrl" type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                <Button onClick={handleUrlApply} variant="outline" className="shrink-0">Apply</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-sm flex items-center">
                <Video className="mr-2 h-4 w-4" /> Video URL
              </Label>
              <div className="flex space-x-2">
                <Input id="videoUrl" type="url" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                <Button onClick={handleVideoUrlApply} variant="outline" className="shrink-0">Apply</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-file-upload" className="text-sm flex items-center">
                <ImageUp className="mr-2 h-4 w-4" /> Upload Image or Video (Max 100MB)
              </Label>
              <Input id="background-file-upload" type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileChange} />
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview:</Label>
                {uploadedFile?.type.startsWith('video/') ? (
                    <video src={previewUrl} className="rounded-md max-h-40 w-auto border border-border" autoPlay loop muted playsInline />
                ) : (
                    <img src={previewUrl} alt="Background Preview" className="rounded-md max-h-40 w-auto object-contain border border-border" />
                )}
                <Button onClick={handleFileUploadApply} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Apply Uploaded File</Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Solid Color Background */}
           <div className="space-y-3">
            <Label className="font-semibold text-base flex items-center text-primary">
                <Paintbrush className="mr-2 h-4 w-4" /> Solid Background Color
            </Label>
             <div className="flex items-center gap-4">
              <ColorPickerPopover 
                value={currentBackgroundColor || 'hsl(220, 25%, 12%)'}
                onChange={handleBackgroundColorSelect}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleBackgroundColorSelect(null)}
                title="Remove solid color"
              >
                <Slash className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a custom color or click the slash icon to restore the default background image.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 pt-3 border-t border-border/30 flex-row justify-between w-full">
           <Button onClick={handleReset} variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" /> Reset Theme & Layout
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


'use client';
import CodefolioDashboard from '@/components/extensions/codefolio/CodefolioDashboard';
import BookshelfDashboard from '@/components/extensions/bookshelf/BookshelfDashboard';
import { BookShelfLogo } from '@/components/logo/BookShelfLogo';

// In a real application, this would come from a database or API.
export const allPlugins = [
  {
    name: 'Codefolio Ally',
    logo: '/logos/codefolio-logo.svg',
    description: 'Track your coding progress across platforms.',
    component: CodefolioDashboard
  },
  {
    name: 'Book Shelf',
    logo: BookShelfLogo,
    description: 'Organize and track your reading list.',
    component: BookshelfDashboard,
  },
  {
    name: 'Android Studio',
    logo: 'https://worldvectorlogo.com/logos/android-studio-1.svg',
    description: 'The official IDE for Android app development.',
    component: BookshelfDashboard, // Placeholder
  },
  {
    name: 'AppCode',
    logo: 'https://worldvectorlogo.com/logos/appcode.svg',
    description: 'Smart IDE for iOS/macOS development by JetBrains.',
    component: BookshelfDashboard, // Placeholder
  },
  {
    name: 'Chrome',
    logo: 'https://worldvectorlogo.com/logos/chrome.svg',
    description: 'Google\'s web browser for a fast, secure experience.',
    component: BookshelfDashboard, // Placeholder
  },
  {
    name: 'Figma',
    logo: 'https://worldvectorlogo.com/logos/figma-1.svg',
    description: 'The collaborative interface design tool.',
    component: BookshelfDashboard, // Placeholder
  },
  {
    name: 'VS Code',
    logo: 'https://worldvectorlogo.com/logos/visual-studio-code-1.svg',
    description: 'A powerful, lightweight source code editor.',
    component: BookshelfDashboard, // Placeholder
  },
  {
    name: 'Blender',
    logo: 'https://worldvectorlogo.com/logos/blender-2.svg',
    description: 'Free and open source 3D creation suite.',
    component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'Azure Data Studio',
      logo: 'https://worldvectorlogo.com/logos/azure-data-studio.svg',
      description: 'Cross-platform database tool for data professionals.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'Brave',
      logo: 'https://worldvectorlogo.com/logos/brave-3.svg',
      description: 'A privacy-focused browser that blocks ads and trackers.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'Canva',
      logo: 'https://worldvectorlogo.com/logos/canva.svg',
      description: 'Online design platform for creating visual content.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'CLion',
      logo: 'https://worldvectorlogo.com/logos/clion.svg',
      description: 'A cross-platform IDE for C and C++ by JetBrains.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'Discord',
      logo: 'https://worldvectorlogo.com/logos/discord-6.svg',
      description: 'All-in-one voice and text chat for gamers.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'Eclipse',
      logo: 'https://worldvectorlogo.com/logos/eclipse-1.svg',
      description: 'An IDE for Java and other programming languages.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'DataGrip',
      logo: 'https://worldvectorlogo.com/logos/datagrip.svg',
      description: 'The cross-platform IDE for databases & SQL.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'DataSpell',
      logo: 'https://worldvectorlogo.com/logos/dataspell.svg',
      description: 'The IDE for professional data scientists.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'DBeaver',
      logo: 'https://worldvectorlogo.com/logos/dbeaver.svg',
      description: 'Free multi-platform universal database tool.',
      component: BookshelfDashboard, // Placeholder
  },
  {
      name: 'Delphi',
      logo: 'https://worldvectorlogo.com/logos/delphi-1.svg',
      description: 'IDE for rapid application development.',
      component: BookshelfDashboard, // Placeholder
  },
];

// Define and export the default plugins separately.
export const DEFAULT_PLUGINS = ['Codefolio Ally', 'Book Shelf', 'VS Code', 'Figma', 'Chrome'];

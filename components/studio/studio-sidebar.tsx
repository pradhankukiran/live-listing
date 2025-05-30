"use client";

import { useState } from 'react';
import { 
  FolderOpen,
  ImagePlus, 
  History, 
  Bookmark, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function StudioSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div 
      className={cn(
        "h-full bg-muted/30 border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex flex-col flex-1 p-2 space-y-2">
        <SidebarItem icon={<FolderOpen />} label="Projects" collapsed={collapsed} />
        <SidebarItem icon={<ImagePlus />} label="New Image" collapsed={collapsed} />
        <SidebarItem icon={<History />} label="History" collapsed={collapsed} />
        <SidebarItem icon={<Bookmark />} label="Saved" collapsed={collapsed} />
      </div>
      
      <div className="p-2 border-t">
        <SidebarItem icon={<Settings />} label="Settings" collapsed={collapsed} />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-8 mt-2"
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            collapsed ? "" : "rotate-180"
          )} />
        </Button>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function SidebarItem({ icon, label, collapsed }: SidebarItemProps) {
  return (
    <Button 
      variant="ghost" 
      className={cn(
        "flex items-center justify-start gap-3 px-2 w-full",
        collapsed ? "justify-center" : "justify-start"
      )}
    >
      <span className="h-5 w-5">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Button>
  );
}
"use client";

import { useState } from 'react';
import { 
  Trash2, 
  Brush, 
  Palette, 
  Wand2, 
  Move,
  Copy,
  Pipette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RegionToolbar() {
  const [activeTab, setActiveTab] = useState("basic");
  
  return (
    <div className="bg-background border-b p-2 flex items-center justify-between">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="ai">AI Actions</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Copy className="h-4 w-4" />
              <span>Copy Selection</span>
            </Button>
            <Button variant="destructive" size="sm" className="gap-1">
              <Trash2 className="h-4 w-4" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
        
        <div className="mt-2">
          <TabsContent value="basic" className="flex items-center gap-2 mt-0">
            <Button variant="outline" size="sm" className="gap-1">
              <Move className="h-4 w-4" />
              <span>Move</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Pipette className="h-4 w-4" />
              <span>Select Similar</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Brush className="h-4 w-4" />
                  <span>Adjust</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Adjustments</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Brightness</label>
                    <input type="range" min="-100" max="100" defaultValue="0" className="w-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Contrast</label>
                    <input type="range" min="-100" max="100" defaultValue="0" className="w-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Saturation</label>
                    <input type="range" min="-100" max="100" defaultValue="0" className="w-full" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </TabsContent>
          
          <TabsContent value="advanced" className="flex items-center gap-2 mt-0">
            <Button variant="outline" size="sm" className="gap-1">
              <Palette className="h-4 w-4" />
              <span>Change Color</span>
            </Button>
            <Button variant="outline" size="sm">Blur</Button>
            <Button variant="outline" size="sm">Sharpen</Button>
            <Button variant="outline" size="sm">Invert</Button>
          </TabsContent>
          
          <TabsContent value="ai" className="flex items-center gap-2 mt-0">
            <Button size="sm" className="gap-1">
              <Wand2 className="h-4 w-4" />
              <span>Remove Object</span>
            </Button>
            <Button size="sm" className="gap-1">
              <Wand2 className="h-4 w-4" />
              <span>Change Style</span>
            </Button>
            <Button size="sm" className="gap-1">
              <Wand2 className="h-4 w-4" />
              <span>Replace Background</span>
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
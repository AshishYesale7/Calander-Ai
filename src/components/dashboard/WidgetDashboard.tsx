'use client';

import React from 'react';
import GridLayout from 'react-grid-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function WidgetDashboard() {
  const layout = [
    { i: 'a', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'b', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'c', x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  ];

  return (
    <GridLayout className="layout" layout={layout} cols={12} rowHeight={100} width={1200}>
      <div key="a">
        <Card className="w-full h-full frosted-glass">
          <CardHeader>
            <CardTitle>Widget A</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a draggable and resizable widget.</p>
          </CardContent>
        </Card>
      </div>
      <div key="b">
        <Card className="w-full h-full frosted-glass">
          <CardHeader>
            <CardTitle>Widget B</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Another widget that you can move around.</p>
          </CardContent>
        </Card>
      </div>
      <div key="c">
        <Card className="w-full h-full frosted-glass">
          <CardHeader>
            <CardTitle>Widget C</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Customize your dashboard layout.</p>
          </CardContent>
        </Card>
      </div>
    </GridLayout>
  );
}

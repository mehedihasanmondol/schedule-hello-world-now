
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Roster = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roster Management</h1>
          <p className="text-gray-600">Manage employee schedules and assignments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Roster calendar view will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

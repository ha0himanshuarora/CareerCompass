"use client";

import * as React from "react";
import { User, Building, School } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
}

const roles = [
  { value: 'student', label: 'Student', icon: User },
  { value: 'recruiter', label: 'Recruiter', icon: Building },
  { value: 'tpo', label: 'TPO', icon: School },
]

export function RoleSelector({ value, onValueChange }: RoleSelectorProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={onValueChange}
      className="grid grid-cols-3 gap-2"
    >
      {roles.map(role => (
        <ToggleGroupItem 
          key={role.value}
          value={role.value} 
          aria-label={`Select ${role.label}`}
          className="flex flex-col h-auto p-4 gap-2 border data-[state=on]:bg-primary/10 data-[state=on]:border-primary data-[state=on]:text-primary"
        >
          <role.icon className="size-5" />
          <span className="text-sm font-medium">{role.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

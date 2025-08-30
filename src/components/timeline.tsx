import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface TimelineEvent {
  title: string;
  date: string;
  description: string;
  icon: LucideIcon;
  status: 'completed' | 'current' | 'upcoming';
}

const statusClasses = {
  completed: {
    wrapper: "text-muted-foreground",
    iconWrapper: "bg-primary",
    icon: "text-primary-foreground",
    line: "bg-primary",
  },
  current: {
    wrapper: "",
    iconWrapper: "bg-primary ring-4 ring-primary/30",
    icon: "text-primary-foreground",
    line: "bg-border",
  },
  upcoming: {
    wrapper: "text-muted-foreground",
    iconWrapper: "bg-border",
    icon: "text-muted-foreground",
    line: "bg-border",
  },
};

export function PlacementTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const classes = statusClasses[event.status];

        return (
          <div key={index} className={cn("flex gap-6 relative", classes.wrapper)}>
            <div className="flex flex-col items-center">
              <div className={cn("size-10 rounded-full flex items-center justify-center", classes.iconWrapper)}>
                <event.icon className={cn("size-5", classes.icon)} />
              </div>
              {!isLast && <div className={cn("w-0.5 flex-1 mt-2", classes.line)} />}
            </div>
            <div className={cn("pb-12", isLast && "pb-0")}>
              <p className="font-semibold text-foreground">{event.title}</p>
              <p className="text-sm">{event.description}</p>
              <time className="text-xs mt-1 block">{event.date}</time>
            </div>
          </div>
        );
      })}
    </div>
  );
}

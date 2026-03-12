import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";

const NotificationDropdown = () => {
  const [notifications] = useState<{ id: string; message: string; time: string }[]>([]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-full hover:bg-surface vm-transition relative" aria-label="Notifications">
          <Bell className="w-5 h-5 text-muted-foreground hover:text-primary" strokeWidth={1.5} />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="p-3 border-b border-border font-semibold text-sm">Notifications</div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="px-3 py-2.5 border-b border-border last:border-0 text-sm">
                <p>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;

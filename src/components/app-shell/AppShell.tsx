"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NotificationsPanel } from "./NotificationsPanel";
import { CommandPalette } from "./CommandPalette";
import { CreateTaskModal } from "@/components/work-os/CreateTaskModal";
import { useWorkState } from "@/lib/state/work-state-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const { deliverables, users, createTask } = useWorkState();

  return (
    <div className="app-shell-root">
      {/* Sidebar: Fixed width (260px), Opaque background, own scroll */}
      <Sidebar isOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />

      {/* Main Content Area: Offset by sidebar width (CSS grid), never renders under sidebar */}
      <div className="app-main-area">
        {/* Topbar: Sticky, solid opaque, correct z-index */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
          onOpenCreateTask={() => setCreateTaskOpen(true)}
        />

        <main className="app-content">
          {children}
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        deliverables={deliverables}
        users={users}
        onCreate={createTask}
      />
    </div>
  );
}

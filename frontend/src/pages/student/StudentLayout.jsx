import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ setMobileOpen }} />
      </main>
    </div>
  );
}

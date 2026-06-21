/**
 * @fileoverview OpenPath Component
 * @module Frontend/App
 * @description Root layout component containing the global Navbar and the main routing Outlet.
 * @dependencies [react-router-dom, Navbar, ThemeProvider]
 * @stateConsumed N/A
 * @stateProduced N/A
 */

import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground transition-colors duration-300">
      <Outlet />
    </div>
  );
}

export default App;

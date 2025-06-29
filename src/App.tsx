import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { FormProvider } from './context/FormContext';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <AppProvider>
        <FormProvider>
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-6xl">
            <Dashboard />
          </main>
          <footer className="text-center p-6 text-gray-500 text-sm">
            <p>© 2025 Family Memories AI Companion. All rights reserved.</p>
          </footer>
        </FormProvider>
      </AppProvider>
    </div>
  );
}

export default App;
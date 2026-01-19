// import { useState } from 'react'

// function App() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
//       <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//         <h1 className="text-3xl font-bold text-gray-800 mb-4">
//           ✅ Setup Successful!
//         </h1>
//         <p className="text-lg text-gray-600 mb-6">
//           Ottalika Frontend is Ready
//         </p>
        
//         <div className="space-y-4">
//           <div className="bg-blue-100 p-4 rounded-lg">
//             <p className="text-blue-800 font-medium">React + TypeScript</p>
//           </div>
//           <div className="bg-green-100 p-4 rounded-lg">
//             <p className="text-green-800 font-medium">Vite Build Tool</p>
//           </div>
//           <div className="bg-purple-100 p-4 rounded-lg">
//             <p className="text-purple-800 font-medium">Tailwind CSS</p>
//           </div>
//         </div>

//         <div className="mt-8">
//           <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
//             Test Button
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default App

// console.log("🚀 App.tsx STARTED executing!");

// import { RouterProvider } from 'react-router-dom';
// import { router } from './routes';

// function App() {
//    console.log("✅ App.tsx function is running!");
//   return <RouterProvider router={router} />;
// }

// export default App;

// App.tsx - Use old BrowserRouter
console.log("🚀 App.tsx STARTED executing!");

import { RouterProvider } from 'react-router-dom';
import React from 'react';
import { router } from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Set dummy token on app start
    const dummyToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6Im93bmVyIn0.velgeO2RRHioK0MsJSFckZG7fjwAZV4dJos4E0llrbw';
    localStorage.setItem('token', dummyToken);
    console.log('✅ Dummy token set in localStorage');
  }, []);
  console.log("✅ App.tsx function is running!");
  return(
    <QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />;
   <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
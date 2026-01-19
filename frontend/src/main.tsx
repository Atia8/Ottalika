// // // import { StrictMode } from 'react'
// // // import { createRoot } from 'react-dom/client'
// // // import './index.css'
// // // import App from './App.tsx'

// // // createRoot(document.getElementById('root')!).render(
// // //   <StrictMode>
// // //     <App />
// // //   </StrictMode>,
// // // )
// // import React from 'react';
// // import ReactDOM from 'react-dom/client';
// // import { AppRoutes } from './routes'; // Adjust path as needed
// // import './index.css';

// // ReactDOM.createRoot(document.getElementById('root')!).render(
// //   <React.StrictMode>
// //     <AppRoutes />
// //   </React.StrictMode>
// // );

// import { RouterProvider } from 'react-router';
// import { router } from './routes';

// function App() {
//   return <RouterProvider router={router} />;
// }

// export default App;

// main.tsx or index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // Make sure this imports App.tsx
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
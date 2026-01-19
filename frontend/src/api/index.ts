// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://localhost:5000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests if exists
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     //  if (!token) {
//     //   // Dummy token (copy from your earlier generated token)
//     //   //const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6Im93bmVyIiwiZW1haWwiOiJvd25lckB0ZXN0LmNvbSIsIm5hbWUiOiJUZXN0IE93bmVyIiwiaWF0IjoxNzM3MjEyMDAwLCJleHAiOjE3Mzc4MTY4MDB9.kR9qQ8YJY6G8wLmN7vX2cT1pK3qA5bB7dE9fGh1jL3mN5oP7rS9tUvWxYz';
//     //           const dummyToken= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsImlhdCI6MTc2MzIxNTY5NSwiZXhwIjoxNzYzODIwNDk1fQ.aQDpkuqlfKgF5Gt7tGLIvSRq0sqW7qgddKiOr2RNbtE'
//     //   config.headers.Authorization = `Bearer ${dummyToken}`;
//     //   console.log('⚠️ Using dummy token for development');
//     // } else {
//     //   config.headers.Authorization = `Bearer ${token}`;
//     // }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default api;
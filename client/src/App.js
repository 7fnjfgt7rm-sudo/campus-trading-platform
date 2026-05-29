import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Publish from './pages/Publish';
import MyProducts from './pages/MyProducts';
import Favorites from './pages/Favorites';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Search from './pages/Search';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/chat" element={
                  <PrivateRoute><Chat /></PrivateRoute>
                } />
                <Route path="/chat/:userId" element={
                  <PrivateRoute><Chat /></PrivateRoute>
                } />
                <Route path="/publish" element={
                  <PrivateRoute><Publish /></PrivateRoute>
                } />
                <Route path="/my-products" element={
                  <PrivateRoute><MyProducts /></PrivateRoute>
                } />
                <Route path="/favorites" element={
                  <PrivateRoute><Favorites /></PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute><Profile /></PrivateRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await login(username, password);
            toast.success('Login successful');
            if (userData.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error("Login Error:", err);
            if (!err.response) {
                toast.error('Unable to connect to server. Please check if the backend is running.');
            } else if (err.response.status === 401) {
                toast.error('Invalid username or password');
            } else {
                toast.error(err.response.data || 'Login failed');
            }
        }
    };

    return (
        <div 
            className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat relative" 
            style={{ backgroundImage: "url('/backgroundpic.webp')" }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl relative z-10 transition-all duration-300 hover:shadow-blue-500/10 border border-white/20">
                <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Sign in to your account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Sign In
                    </button>

                    <div className="text-center mt-4 text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 hover:underline">
                            Sign Up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;

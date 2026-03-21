import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Lock, Save, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const Settings = () => {
    const { user, loading, checkAuth, logout } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        password: '',
        confirmPassword: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Sync state when user context is loaded
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || ''
            }));
            setImagePreview(user.profile_picture || null);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match");
        }

        setUpdating(true);
        const data = new FormData();
        data.append('full_name', formData.full_name);
        
        if (formData.password && formData.password.trim() !== "") {
            data.append('password', formData.password);
        }
        
        if (selectedImage) {
            data.append('image', selectedImage);
        }

        try {
            await axios.put('/api/users/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Profile updated successfully");
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setSelectedImage(null);
            await checkAuth(); // Refresh user context
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update profile");
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Signed out successfully");
        } catch (err) {
            toast.error("Failed to sign out");
        }
    };

    if (loading || !user) {
        return <div className="flex items-center justify-center h-[60vh]">Loading profile...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-10 px-4"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>
            
            <Card className="w-full border-none shadow-xl ring-1 ring-slate-200">
                <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle className="text-2xl font-bold text-slate-900">Profile</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Update your profile and security credentials.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center space-y-4 pb-8 border-b">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-2 ring-slate-100 bg-slate-100 flex items-center justify-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-slate-300" />
                                    )}
                                </div>
                                <label 
                                    htmlFor="image-upload" 
                                    className="absolute bottom-1 right-1 bg-slate-900 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-slate-800 transition-colors border-2 border-white"
                                >
                                    <Save className="w-4 h-4 rotate-0" />
                                    <input 
                                        type="file" 
                                        id="image-upload" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                            <div className="text-center">
                                <h4 className="text-sm font-bold text-slate-900">Profile Picture</h4>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">PNG, JPG or WebP • Max 5MB</p>
                            </div>
                        </div>
                        
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-slate-500">System Username</Label>
                                <Input value={user?.username} disabled className="bg-slate-50 border-none font-medium text-slate-600 h-12" />
                            </div>
                            
                            <div className="space-y-2">
                                 <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
                                 <div className="relative">
                                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="full_name" 
                                        name="full_name" 
                                        className="pl-12 h-12 border-slate-200 focus:ring-slate-900"
                                        value={formData.full_name} 
                                        onChange={handleChange} 
                                        required
                                    />
                                 </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Security Credentials
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="password" title="Leave empty to keep current" className="text-xs font-bold uppercase tracking-widest text-slate-500">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                        <Input 
                                            id="password" 
                                            name="password" 
                                            type="password"
                                            className="pl-12 h-12 border-slate-200"
                                            placeholder="••••••••"
                                            value={formData.password} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" title="Leave empty to keep current" className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirm Rotation</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                        <Input 
                                            id="confirmPassword" 
                                            name="confirmPassword" 
                                            type="password"
                                            className="pl-12 h-12 border-slate-200"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t">
                            <Button 
                                type="submit" 
                                disabled={updating}
                                className="bg-slate-900 hover:bg-slate-800 h-12 px-10 rounded-xl font-bold shadow-lg shadow-slate-200"
                            >
                                {updating ? (
                                    <>
                                        <Save className="w-4 h-4 mr-2 animate-spin" />
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Update Profile
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Trash2, 
    UserPlus, 
    ShieldAlert, 
    Users, 
    TrendingUp, 
    Activity,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const AdminPanel = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [systemSettings, setSystemSettings] = useState({
        maintenance_mode: false,
        allow_registration: true
    });
    const [systemStats, setSystemStats] = useState({
        totalUsers: 0,
        activeNow: 0,
        systemStatus: 'Operational',
        lastBackup: 'Never'
    });

    useEffect(() => {
        fetchUsers();
        fetchSystemSettings();
        fetchSystemStats();
    }, []);

    const fetchSystemStats = async () => {
        try {
            const res = await axios.get('/api/admin/stats');
            setSystemStats(res.data);
        } catch (err) {
            console.error("Failed to fetch system stats", err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
            toast.error("Failed to load user list");
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemSettings = async () => {
        try {
            const res = await axios.get('/api/admin/settings');
            setSystemSettings(res.data);
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', newUser);
            toast.success("New user created successfully");
            setIsAddUserOpen(false);
            setNewUser({ username: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to create user");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await axios.delete(`/api/admin/users/${userId}`);
                toast.success("User deleted successfully");
                fetchUsers();
                fetchSystemStats();
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete user");
            }
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await axios.patch(`/api/admin/users/${userId}/status`, { is_active: !currentStatus });
            toast.success(`User ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
            fetchUsers();
            fetchSystemStats();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update user status");
        }
    };

    const updateSecuritySetting = async (key, value) => {
        try {
            const newSettings = { ...systemSettings, [key]: value };
            await axios.put('/api/admin/settings', newSettings);
            setSystemSettings(newSettings);
            toast.success("Security settings updated");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update settings");
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-rose-500" />
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-gray-500 max-w-md">You do not have permission to view the administrative panel. Please contact your system administrator.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Administration</h1>
                <p className="text-muted-foreground mt-1 text-lg">Manage users, security settings, and view system logs.</p>
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-slate-50 border-l-4 border-l-slate-600">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-200 p-3 rounded-xl">
                                <Users className="w-6 h-6 text-slate-700" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Traders</p>
                                <p className="text-2xl font-bold text-slate-900">{systemStats.totalTraders || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm bg-emerald-50 border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-3 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Inventory Value</p>
                                <p className="text-lg font-bold text-emerald-900">
                                    {new Number(systemStats.totalInventoryValue).toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Database Status</p>
                                <p className="text-lg font-bold text-blue-900">Connected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-purple-50 border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <Activity className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Active Traders</p>
                                <p className="text-lg font-bold text-purple-900">{systemStats.activeTraders || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Security Settings Section (NEW) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="w-5 h-5 mr-2" />
                            Security Configuration
                        </CardTitle>
                        <CardDescription>Manage system-wide security and access controls.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Maintenance Mode</Label>
                                <p className="text-sm text-gray-500">Block all non-admin access to the system.</p>
                            </div>
                            <Button 
                                variant={systemSettings.maintenance_mode ? "destructive" : "outline"}
                                onClick={() => updateSecuritySetting('maintenance_mode', !systemSettings.maintenance_mode)}
                            >
                                {systemSettings.maintenance_mode ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Public Registration</Label>
                                <p className="text-sm text-gray-500">Allow new users to register an account.</p>
                            </div>
                            <Button 
                                variant={systemSettings.allow_registration ? "default" : "outline"}
                                className={systemSettings.allow_registration ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                                onClick={() => updateSecuritySetting('allow_registration', !systemSettings.allow_registration)}
                            >
                                {systemSettings.allow_registration ? 'Allowed' : 'Blocked'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            {/* User Management Section */}
            <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center">
                            <Users className="w-5 h-5 mr-2 text-slate-600" />
                            User Management
                        </CardTitle>
                        <CardDescription>View and manage registered system users.</CardDescription>
                    </div>
                     <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                             <Button className="bg-slate-900 hover:bg-slate-800">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to the system. They will specific permissions based on their role.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input 
                                        id="username" 
                                        value={newUser.username} 
                                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input 
                                        id="password" 
                                        type="password"
                                        value={newUser.password} 
                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <select 
                                        id="role" 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                    >
                                        <option value="user">User (Standard Access)</option>
                                        <option value="admin">Administrator (Full Access)</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" className="w-full">Create Account</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-slate-900">Username</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">Loading users...</TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No users found.</TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.username}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                                                    u.role === 'admin' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-gray-100 text-gray-700 border-gray-200"
                                                )}>
                                                    {u.role}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        u.is_active ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                                                    )}></div>
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        u.is_active ? "text-emerald-600" : "text-gray-500"
                                                    )}>
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className={cn(
                                                            "h-8 px-2 text-xs font-medium border transition-colors",
                                                            u.is_active 
                                                                ? "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700" 
                                                                : "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:text-amber-700"
                                                        )}
                                                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                                                        disabled={u.id === user?.id}
                                                    >
                                                        {u.is_active ? 'Disable' : 'Enable'}
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        disabled={u.id === user?.id} // Prevent self-deletion
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    );
};

export default AdminPanel;
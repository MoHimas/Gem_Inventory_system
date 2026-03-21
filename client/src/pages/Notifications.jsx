import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check, Trash2, Globe, User, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'system'

    const parseNotificationDate = (dateStr) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        // Fallback for strings without TZ info, though the backend now handles this
        if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
             return new Date(dateStr.replace(' ', 'T') + 'Z');
        }
        return d;
    };
    useEffect(() => {
        fetchNotifications();
    }, [viewMode]); // Re-fetch when mode changes
    const fetchNotifications = async () => {
        try {
            const endpoint = viewMode === 'system' && user.role === 'admin' 
                ? '/api/notifications/all' 
                : '/api/notifications';
            const res = await axios.get(endpoint);
            setNotifications(res.data);
        } catch (err) {
            toast.error("Failed to fetch notifications");
        }
    };
    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            toast.error("Failed to mark as read");
        }
    };
    const deleteNotification = async (id) => {
        try {
            await axios.delete(`/api/notifications/${id}`);
            fetchNotifications();
            toast.success("Notification deleted");
        } catch (err) {
            toast.error("Failed to delete notification");
        }
    };
    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
                        <Bell className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notifications</h1>
                        <p className="text-muted-foreground text-sm">Stay updated with system activities and personal alerts.</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm ring-1 ring-gray-100">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">Alert Center</CardTitle>
                        {user?.role === 'admin' && (
                            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full sm:w-[350px]">
                                <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-lg">
                                    <TabsTrigger value="mine" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">My Alerts</TabsTrigger>
                                    <TabsTrigger value="system" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">System</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-muted-foreground">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <Bell className="w-12 h-12 opacity-20" />
                            </div>
                            <p className="font-medium italic">Your notification inbox is currently clear.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    className={cn(
                                        "group relative p-5 transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start",
                                        notif.is_read 
                                            ? "bg-white opacity-80" 
                                            : "bg-blue-50/30 border-l-4 border-l-blue-600 shadow-[inset_-2px_0_10px_rgba(37,99,235,0.02)]"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-xl mt-0.5 shadow-sm",
                                        notif.is_read ? "bg-gray-100 text-gray-400" : "bg-blue-600 text-white"
                                    )}>
                                        {viewMode === 'system' ? <Globe className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {viewMode === 'system' && (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                    <User className="w-3 h-3" /> {notif.username}
                                                </span>
                                            )}
                                            {!notif.is_read && (
                                                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-1 rounded-md border border-blue-200">
                                                    Unread
                                                </span>
                                            )}
                                            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1.5 sm:ml-auto">
                                                <Clock className="w-3 h-3" /> {formatDistanceToNow(parseNotificationDate(notif.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-[13px] sm:text-sm leading-relaxed",
                                            notif.is_read ? "text-gray-500" : "text-gray-800 font-semibold"
                                        )}>
                                            {notif.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4 sm:self-center justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                        {!notif.is_read && viewMode === 'mine' && (
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-9 w-full sm:w-9 px-3 sm:px-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg sm:rounded-full bg-blue-50/50 sm:bg-transparent"
                                                onClick={() => markAsRead(notif.id)}
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4 sm:mr-0 mr-2" />
                                                <span className="sm:hidden text-xs font-bold">Mark Read</span>
                                            </Button>
                                        )}
                                        {viewMode === 'mine' && (
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-9 w-full sm:w-9 px-3 sm:px-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg sm:rounded-full bg-gray-50 sm:bg-transparent"
                                                onClick={() => deleteNotification(notif.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                                                <span className="sm:hidden text-xs font-bold">Delete</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
export default Notifications;
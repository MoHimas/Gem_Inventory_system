import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    ArrowDownCircle, 
    Search, 
    ArrowUpDown, 
    Calendar, 
    User, 
    FileText,
    Clock,
    AlertCircle,
    CheckCircle2,
    Gem,
    TrendingUp,
    DollarSign,
    AlertTriangle,
    BadgeAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Receivables = () => {
    const [receivables, setReceivables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filterStatus, setFilterStatus] = useState('all'); // all, Unpaid, Partial

    useEffect(() => {
        fetchReceivables();
    }, []);

    const fetchReceivables = async () => {
        try {
            const res = await axios.get('/api/sales');
            // Filter for Unpaid or Partial
            const unpaid = res.data.filter(p => p.payment_status !== 'Paid');
            setReceivables(unpaid);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch receivables data");
        } finally {
            setLoading(false);
        }
    };

    const totalReceivable = useMemo(() => {
        return receivables.reduce((sum, p) => {
            const due = parseFloat(p.total_price) - parseFloat(p.paid_amount || 0);
            return sum + due;
        }, 0);
    }, [receivables]);

    const receivablesStats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const overdue = receivables.filter(r => new Date(r.sale_date) < thirtyDaysAgo);
        const overdueAmount = overdue.reduce((sum, r) => sum + (parseFloat(r.total_price) - parseFloat(r.paid_amount || 0)), 0);
        
        const highValue = receivables.filter(r => (parseFloat(r.total_price) - parseFloat(r.paid_amount || 0)) > 5000); // Items > 5k
        
        return {
            overdueCount: overdue.length,
            overdueAmount,
            highValueCount: highValue.length,
            avgReceivable: totalReceivable / (receivables.length || 1)
        };
    }, [receivables, totalReceivable]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredData = useMemo(() => {
        let data = [...receivables];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item => 
                item.customer_name?.toLowerCase().includes(query) ||
                item.gem_name?.toLowerCase().includes(query) ||
                item.invoice_number?.toLowerCase().includes(query)
            );
        }

        // Status Filter
        if (filterStatus !== 'all') {
            data = data.filter(item => item.payment_status === filterStatus);
        }

        // Sorting
        data.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'date') {
                valA = new Date(a.sale_date);
                valB = new Date(b.sale_date);
            } else if (sortConfig.key === 'due') {
                valA = parseFloat(a.total_price) - parseFloat(a.paid_amount || 0);
                valB = parseFloat(b.total_price) - parseFloat(b.paid_amount || 0);
            } else {
                valA = a[sortConfig.key];
                valB = b[sortConfig.key];
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [receivables, searchQuery, sortConfig, filterStatus]);

    const getAgingDetails = (date) => {
        const diffTime = Math.abs(new Date() - new Date(date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 30) return { label: `${diffDays} days`, color: 'text-rose-600 font-bold', icon: AlertCircle };
        if (diffDays > 7) return { label: `${diffDays} days`, color: 'text-amber-600', icon: Clock };
        return { label: `${diffDays} days`, color: 'text-emerald-600', icon: CheckCircle2 };
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Receivables</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Track pending collections and outstanding customer invoices.</p>
                </div>
                <Card className="w-full md:w-80 relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
                    <CardHeader className="py-5">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            Total Pending Collection
                        </CardTitle>
                        <div className="text-3xl font-bold mt-1">
                            {formatCurrency(totalReceivable)}
                        </div>
                    </CardHeader>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <DollarSign className="w-24 h-24" />
                    </div>
                </Card>
            </div>

            {/* Controls Section */}
            <div className="grid gap-4 md:grid-cols-12 items-center">
                <div className="md:col-span-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by customer, invoice or gem..." 
                        className="pl-10 h-11 bg-white border-gray-200 focus:ring-cyan-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="md:col-span-3">
                    <div className="flex bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                        <button 
                            onClick={() => setFilterStatus('all')}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                filterStatus === 'all' ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >All</button>
                        <button 
                            onClick={() => setFilterStatus('Unpaid')}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                filterStatus === 'Unpaid' ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >Unpaid</button>
                        <button 
                            onClick={() => setFilterStatus('Partial')}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                filterStatus === 'Partial' ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >Partial</button>
                    </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                     <p className="text-sm font-medium text-gray-500">
                        Monitoring <span className="text-cyan-600 font-bold">{sortedAndFilteredData.length}</span> invoices
                     </p>
                </div>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-sm ring-1 ring-gray-100">
                <CardHeader className="bg-gray-50/50 border-b py-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-600" />
                        <CardTitle className="text-lg">Outstanding Invoices</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-gray-50/30">
                                    <TableHead className="w-[120px]">
                                        <button onClick={() => handleSort('date')} className="flex items-center hover:text-cyan-600 transition-colors">
                                            Date <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>
                                        <button onClick={() => handleSort('customer_name')} className="flex items-center hover:text-cyan-600 transition-colors">
                                            Customer <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Aging</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Price</TableHead>
                                    <TableHead className="text-right">Collected</TableHead>
                                    <TableHead className="text-right font-bold text-gray-900">
                                        <button onClick={() => handleSort('due')} className="flex items-center justify-end w-full hover:text-cyan-600 transition-colors">
                                            Due <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-48">
                                            <div className="flex flex-col items-center gap-2">
                                                <TrendingUp className="w-8 h-8 text-cyan-500 animate-pulse" />
                                                <p className="text-muted-foreground font-medium">Loading receivables data...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedAndFilteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-48 text-muted-foreground italic">
                                            No outstanding receivables found. Great job!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedAndFilteredData.map((p) => {
                                        const total = parseFloat(p.total_price);
                                        const paid = parseFloat(p.paid_amount || 0);
                                        const due = total - paid;
                                        const aging = getAgingDetails(p.sale_date);
                                        return (
                                            <TableRow key={p.id} className="hover:bg-cyan-50/30 transition-colors group">
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-sm font-medium">{new Date(p.sale_date).toLocaleDateString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-cyan-600 font-bold">{p.invoice_number}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center">
                                                            <User className="w-3.5 h-3.5 text-cyan-600" />
                                                        </div>
                                                        <span className="font-semibold text-gray-700">{p.customer_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Gem className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-sm text-gray-600">{p.gem_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={cn("flex items-center gap-1.5 text-xs", aging.color)}>
                                                        <aging.icon className="w-3.5 h-3.5" />
                                                        {aging.label}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                                        p.payment_status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                    )}>
                                                        {p.payment_status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-gray-600">{formatCurrency(total)}</TableCell>
                                                <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(paid)}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-red-50 text-red-700 font-bold text-sm shadow-sm border border-red-100">
                                                        {formatCurrency(due)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Summary Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="bg-white border-none shadow-sm ring-1 ring-rose-100 overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="pt-6 relative">
                        <div className="flex items-center gap-4">
                            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Critical Overdue</p>
                                <div className="flex flex-col">
                                    <p className="text-2xl font-extrabold text-gray-900 leading-none">
                                        {receivablesStats.overdueCount} Invoices
                                    </p>
                                    <p className="text-sm font-medium text-rose-500 mt-1 italic">
                                        {formatCurrency(receivablesStats.overdueAmount)} &gt; 30 Days
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-rose-500/5 to-transparent rounded-bl-full" />
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm ring-1 ring-cyan-100 overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="pt-6 relative">
                        <div className="flex items-center gap-4">
                            <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-100 group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1">Avg. Receivable Value</p>
                                <p className="text-2xl font-extrabold text-gray-900 leading-none">
                                    {formatCurrency(receivablesStats.avgReceivable)}
                                </p>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Avg. receivable per sale</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Receivables;
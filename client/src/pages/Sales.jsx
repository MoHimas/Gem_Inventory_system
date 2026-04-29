import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Plus, 
    ShoppingCart, 
    Search, 
    ArrowUpDown, 
    Edit2,
    Trash2, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    Users,
    Gem,
    FileText, 
    Package,
    Loader2,
    Check,
    ChevronDown,
    UserPlus,
    X,
    Building2,
    Phone,
    Mail,
    MapPin,
    User
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
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'sale_date', direction: 'desc' });
    const [filterStatus, setFilterStatus] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form Data
    const [formData, setFormData] = useState({
        stock_id: '',
        customer_id: '',
        quantity: '',
        price_per_carat: '',
        paid_amount: '',
        payment_method: 'Cash',
        sale_date: new Date().toISOString().split('T')[0]
    });
    
    // Custom Customer Selector State
    const [customerSearch, setCustomerSearch] = useState("");
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salesRes, stocksRes, customersRes] = await Promise.all([
                axios.get('/api/sales'),
                axios.get('/api/stocks'),
                axios.get('/api/customers')
            ]);
            setSales(salesRes.data);
            setStocks(stocksRes.data.filter(s => s.quantity > 0)); // Only show available stock
            setCustomers(customersRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setEditingSale(null);
        setFormData({
            stock_id: '',
            customer_id: '',
            quantity: '',
            price_per_carat: '',
            paid_amount: '',
            payment_method: 'Cash',
            sale_date: new Date().toISOString().split('T')[0]
        });
        setCustomerSearch("");
        setIsAddingCustomer(false);
        setNewCustomerData({
            name: "",
            phone: "",
            email: "",
            address: "",
        });
    };

    const handleNewCustomerChange = (e) => {
        setNewCustomerData({ ...newCustomerData, [e.target.name]: e.target.value });
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        if (!newCustomerData.name || !newCustomerData.phone) {
            toast.error("Name and Phone are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post("/api/customers", newCustomerData);
            const createdCustomer = res.data;
            
            // Refresh customers list
            const customersRes = await axios.get("/api/customers");
            setCustomers(customersRes.data);
            
            // Auto-select the new customer
            setFormData({ ...formData, customer_id: createdCustomer.id });
            setCustomerSearch("");
            setIsAddingCustomer(false);
            setIsCustomerDropdownOpen(false);
            toast.success("Customer created and selected!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to create customer");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers;
        const query = customerSearch.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.phone && c.phone.includes(query))
        );
    }, [customers, customerSearch]);

    const selectedCustomerLabel = useMemo(() => {
        const c = customers.find((cust) => cust.id.toString() === formData.customer_id.toString());
        return c ? c.name : "Select a Customer";
    }, [customers, formData.customer_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customer_id) {
            toast.error("Please select a customer first");
            return;
        }

        setIsSubmitting(true);
        // Client-side validation: Sale date vs Purchase date
        const selectedStock = stocks.find(s => s.id == formData.stock_id);
        if (selectedStock && formData.sale_date) {
            const saleDate = new Date(formData.sale_date);
            const purchaseDate = new Date(selectedStock.purchase_date);
            if (saleDate < purchaseDate) {
                toast.error(`Sale date cannot be earlier than the acquisition date (${purchaseDate.toLocaleDateString()})`);
                setIsSubmitting(false);
                return;
            }
            if (saleDate > new Date()) {
                toast.error("Sale date cannot be in the future");
                setIsSubmitting(false);
                return;
            }
        }

        try {
            if (editingSale) {
                await axios.put(`/api/sales/${editingSale.id}`, formData);
                toast.success("Sale updated successfully!");
            } else {
                await axios.post('/api/sales', formData);
                toast.success("Sale recorded successfully!");
            }
            setIsAddOpen(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to finalize sale");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (sale) => {
        setEditingSale(sale);
        setFormData({
            stock_id: sale.gemstone_id,
            customer_id: sale.customer_id,
            quantity: sale.quantity,
            price_per_carat: sale.price_per_carat || (sale.total_price / sale.quantity / 1), // Standard logic
            paid_amount: sale.paid_amount,
            payment_method: sale.payment_method,
            sale_date: sale.sale_date ? new Date(sale.sale_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsAddOpen(true);
    };

    const handleMarkAsPaid = async (sale) => {
        try {
            await axios.patch(`/api/sales/${sale.id}/payment`, { paid_amount: sale.total_price });
            toast.success("Payment marked as fully paid!");
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update payment status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? Deleting this sale will restore the gemstone quantity to inventory.")) {
            try {
                await axios.delete(`/api/sales/${id}`);
                toast.success("Sale deleted and stock restored");
                fetchData();
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete sale");
            }
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredData = useMemo(() => {
        let data = [...sales];
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
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            // Handle specific keys if needed, otherwise generic
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            } else {
                // Ensure numbers for price fields
                valA = parseFloat(valA || 0);
                valB = parseFloat(valB || 0);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [sales, searchQuery, sortConfig, filterStatus]);

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_price), 0);
        const totalCollected = sales.reduce((sum, s) => sum + parseFloat(s.paid_amount || 0), 0);
        const totalPieces = sales.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);
        const pending = totalRevenue - totalCollected;
        return { totalRevenue, pending, count: sales.length, totalPieces };
    }, [sales]);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Track transactions, manage invoices, and monitor collections.</p>
                </div>
                <div className="flex gap-4">
                     <Card className="hidden lg:block w-60 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <CardHeader className="py-4">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                                <TrendingUp className="w-3.5 h-3.5 mr-2" />
                                Total Revenue
                            </CardTitle>
                            <div className="text-2xl font-bold mt-0.5">
                                {formatCurrency(stats.totalRevenue)}
                            </div>
                        </CardHeader>
                    </Card>

                    <Dialog
                        open={isAddOpen}
                        onOpenChange={(open) => {
                            setIsAddOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                             <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-6 shadow-lg shadow-blue-100 transition-all active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                New Sales
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                            <DialogHeader>
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                                        {editingSale ? 'Modify Sale' : 'Record New Sale'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {editingSale ? 'Update sale record and adjust stock.' : 'Enter the details of the gem sale below.'}
                                    </DialogDescription>
                                </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock_id">Gemstone from Inventory</Label>
                                        <select 
                                            id="stock_id" 
                                            name="stock_id"
                                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={formData.stock_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select a Gemstone</option>
                                            {stocks.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    [{s.sku || 'N/A'}] {s.name} ({s.quantity} avail)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Target Customer</Label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!editingSale) {
                                                        setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
                                                        setIsAddingCustomer(false);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                                                    editingSale && "opacity-60 cursor-not-allowed"
                                                )}
                                                disabled={editingSale}
                                            >
                                                <span className="truncate">
                                                    {selectedCustomerLabel}
                                                </span>
                                                <ChevronDown
                                                    className={cn(
                                                        "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                                                        isCustomerDropdownOpen && "rotate-180"
                                                    )}
                                                />
                                            </button>

                                            {isCustomerDropdownOpen && (
                                                <>
                                                    <div 
                                                        className="fixed inset-0 z-40" 
                                                        onClick={() => setIsCustomerDropdownOpen(false)}
                                                    />
                                                    <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top">
                                                        <div className="p-2 border-b">
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="Search customer or phone..."
                                                                    className="pl-8 h-9 text-xs focus-visible:ring-blue-500"
                                                                    value={customerSearch}
                                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto p-1">
                                                            {filteredCustomers.length === 0 ? (
                                                                <div className="py-6 text-center text-xs text-muted-foreground">
                                                                    No customers found.
                                                                </div>
                                                            ) : (
                                                                filteredCustomers.map((c) => (
                                                                    <button
                                                                        key={c.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            "flex w-full items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-900 transition-colors",
                                                                            formData.customer_id.toString() === c.id.toString() && "bg-blue-50 text-blue-900"
                                                                        )}
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, customer_id: c.id.toString() });
                                                                            setIsCustomerDropdownOpen(false);
                                                                            setCustomerSearch("");
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                                                                {c.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div className="flex flex-col items-start">
                                                                                <span className="font-medium">{c.name}</span>
                                                                                <span className="text-[10px] text-muted-foreground">{c.phone}</span>
                                                                            </div>
                                                                        </div>
                                                                        {formData.customer_id.toString() === c.id.toString() && (
                                                                            <Check className="h-4 w-4 text-blue-600" />
                                                                        )}
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                        <div className="p-1 border-t bg-gray-50/50">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsAddingCustomer(true);
                                                                    setIsCustomerDropdownOpen(false);
                                                                }}
                                                                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Create New Customer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Inline New Customer Form */}
                                        {isAddingCustomer && (
                                            <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2">
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        Quick Customer Add
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingCustomer(false)}
                                                        className="p-1 hover:bg-blue-100 rounded-full text-blue-400 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase text-blue-900/60 font-bold tracking-wider">Customer Name *</Label>
                                                            <Input 
                                                                name="name"
                                                                placeholder="John Doe" 
                                                                className="h-9 text-xs bg-white border-blue-100 focus:ring-blue-500"
                                                                value={newCustomerData.name}
                                                                onChange={handleNewCustomerChange}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase text-blue-900/60 font-bold tracking-wider">Phone *</Label>
                                                            <Input 
                                                                name="phone"
                                                                placeholder="+94..." 
                                                                className="h-9 text-xs bg-white border-blue-100 focus:ring-blue-500"
                                                                value={newCustomerData.phone}
                                                                onChange={handleNewCustomerChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase text-blue-900/60 font-bold tracking-wider">Email</Label>
                                                        <Input 
                                                            name="email"
                                                            type="email"
                                                            placeholder="customer@mail.com" 
                                                            className="h-9 text-xs bg-white border-blue-100 focus:ring-blue-500"
                                                            value={newCustomerData.email}
                                                            onChange={handleNewCustomerChange}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase text-blue-900/60 font-bold tracking-wider">Address</Label>
                                                        <Input 
                                                            name="address"
                                                            placeholder="Shipping or billing address" 
                                                            className="h-9 text-xs bg-white border-blue-100 focus:ring-blue-500"
                                                            value={newCustomerData.address}
                                                            onChange={handleNewCustomerChange}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={handleCreateCustomer}
                                                        disabled={isSubmitting || !newCustomerData.name || !newCustomerData.phone}
                                                        className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-xs font-bold shadow-sm"
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                                                        ) : (
                                                            <CheckCircle className="w-3 h-3 mr-2" />
                                                        )}
                                                        Add & Select Customer
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="sale_date">Sale Date</Label>
                                        <Input 
                                            id="sale_date" 
                                            name="sale_date" 
                                            type="date"
                                            className="h-11"
                                            value={formData.sale_date} 
                                            onChange={handleChange} 
                                            max={new Date().toISOString().split('T')[0]}
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity Sold</Label>
                                        <Input 
                                            id="quantity" 
                                            name="quantity" 
                                            type="number" 
                                            min="1"
                                            className="h-11"
                                            value={formData.quantity} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price_per_carat">Negotiated Price/Ct (LKR)</Label>
                                        <Input 
                                            id="price_per_carat" 
                                            name="price_per_carat" 
                                            type="number" 
                                            step="0.01"
                                            className="h-11"
                                            placeholder="Standard if empty"
                                            value={formData.price_per_carat} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>

                                <div className="p-5 border rounded-xl bg-blue-50/50 border-blue-100 flex flex-col gap-4">
                                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Financial settlement</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="payment_method">Payment Method</Label>
                                            <select 
                                                id="payment_method" 
                                                name="payment_method"
                                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                value={formData.payment_method}
                                                onChange={handleChange}
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Credit">Credit (Pay Later)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paid_amount">Amount (LKR)</Label>
                                             <Input 
                                                id="paid_amount" 
                                                name="paid_amount" 
                                                type="number" 
                                                step="0.01"
                                                className="h-11"
                                                placeholder="0.00"
                                                value={formData.paid_amount} 
                                                onChange={handleChange} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : editingSale ? (
                                            'Update Sale'
                                        ) : (
                                            'Confirm Sale'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-amber-50 border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-100 p-3 rounded-xl">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Collection</p>
                                <p className="text-2xl font-bold text-amber-900">{formatCurrency(stats.pending)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Orders</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.count} Transactions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="border-none shadow-sm bg-emerald-50 border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-3 rounded-xl">
                                <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Pieces</p>
                                <p className="text-2xl font-bold text-emerald-900">{stats.totalPieces} Pieces</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by customer, gemstone or invoice..." 
                        className="pl-10 h-11 bg-white border-gray-200 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {['all', 'Paid', 'Partial', 'Unpaid'].map((status) => (
                        <Button 
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-11 px-4 flex-1 md:flex-none capitalize font-medium",
                                filterStatus === status ? "bg-blue-600 shadow-md shadow-blue-100" : "bg-white text-gray-600 hover:bg-gray-50"
                            )}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-gray-50/50">
                                    <TableHead>
                                        <button onClick={() => handleSort('sale_date')} className="flex items-center hover:text-blue-600 transition-colors uppercase text-[10px] font-bold tracking-widest">
                                            Date <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">Invoice</TableHead>
                                    <TableHead>
                                        <button onClick={() => handleSort('customer_name')} className="flex items-center hover:text-blue-600 transition-colors uppercase text-[10px] font-bold tracking-widest">
                                            Customer <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">SKU</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">Gemstone</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">Qty</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-widest">Status</TableHead>
                                    <TableHead className="text-right">
                                        <button onClick={() => handleSort('total_price')} className="flex items-center justify-end w-full hover:text-blue-600 transition-colors uppercase text-[10px] font-bold tracking-widest">
                                            Total <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-right uppercase text-[10px] font-bold tracking-widest">Due</TableHead>
                                    <TableHead className="w-[120px] text-right uppercase text-[10px] font-bold tracking-widest">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center h-48">
                                            <div className="flex flex-col items-center gap-2">
                                                <TrendingUp className="w-8 h-8 text-blue-500 animate-pulse" />
                                                <p className="text-muted-foreground font-medium">Loading sales data...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedAndFilteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center h-48 text-muted-foreground italic">
                                            No matching sales records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedAndFilteredData.map((sale) => {
                                        const total = parseFloat(sale.total_price);
                                        const paid = parseFloat(sale.paid_amount || 0);
                                        const due = total - paid;
                                        return (
                                            <TableRow key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <TableCell className="font-medium text-gray-500 text-xs">
                                                    {new Date(sale.sale_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-blue-600 font-bold">{sale.invoice_number}</TableCell>
                                                <TableCell className="font-bold text-gray-900">{sale.customer_name}</TableCell>
                                                <TableCell className="font-mono text-xs text-gray-500">{sale.sku || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Gem className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-sm font-medium">{sale.gem_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-gray-700">{sale.quantity}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                        sale.payment_status === 'Paid' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                        sale.payment_status === 'Partial' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        "bg-rose-50 text-rose-700 border-rose-100"
                                                    )}>
                                                        {sale.payment_status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-gray-900">{formatCurrency(total)}</TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-bold",
                                                    due > 0 ? "text-rose-600" : "text-emerald-600"
                                                )}>
                                                    {due > 0 ? formatCurrency(due) : 'Settled'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Edit Sale"
                                                            onClick={() => handleEdit(sale)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        {due > 0 && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                title="Mark as Paid"
                                                                onClick={() => handleMarkAsPaid(sale)}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                            title="Delete Sale"
                                                            onClick={() => handleDelete(sale.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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
        </div>
    );
};

export default Sales;

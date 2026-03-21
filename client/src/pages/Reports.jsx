import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    FileText, 
    Download, 
    BarChart3,
    ArrowDownCircle,
    ArrowUpCircle,
    Users,
    Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Default to Jan 1st
        end: new Date().toISOString().split('T')[0]
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ total_amount: 0, count: 0 });

    useEffect(() => {
        fetchReportData();
    }, [reportType, dateRange]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            let fetchedData = [];

            // Determine endpoint base
            switch(reportType) {
                case 'sales':
                case 'receivables':
                case 'customer_summary':
                    endpoint = '/api/sales'; // Fetch all, filter client-side
                    break;
                case 'purchases':
                case 'payables':
                case 'supplier_summary':
                    endpoint = '/api/purchases';
                    break;
                case 'inventory':
                    endpoint = '/api/stocks';
                    break;
                default:
                    endpoint = '/api/sales';
            }

            const res = await axios.get(endpoint);
            fetchedData = res.data;

            // Client-side Processing & Filtering
            if (reportType === 'sales') {
                 const start = new Date(dateRange.start);
                 const end = new Date(dateRange.end);
                 // Reset time parts for accurate comparison
                 start.setHours(0,0,0,0);
                 end.setHours(23,59,59,999);
                 
                 fetchedData = fetchedData.filter(item => {
                    const d = new Date(item.sale_date);
                    return d >= start && d <= end;
                 });
            } else if (reportType === 'purchases') {
                 const start = new Date(dateRange.start);
                 const end = new Date(dateRange.end);
                 start.setHours(0,0,0,0);
                 end.setHours(23,59,59,999);

                 fetchedData = fetchedData.filter(item => {
                    const d = new Date(item.purchase_date);
                    return d >= start && d <= end;
                 });
            } else if (reportType === 'receivables') {
                // Filter for unpaid sales (Ignore Date Range - Show ALL Due)
                fetchedData = fetchedData.filter(item => item.payment_status !== 'Paid');
            } else if (reportType === 'payables') {
                // Filter for unpaid purchases (Ignore Date Range - Show ALL Due)
                fetchedData = fetchedData.filter(item => item.payment_status !== 'Paid');
            } else if (reportType === 'customer_summary') {
                 // Group by customer
                 const customerMap = {};
                 fetchedData.forEach(item => {
                     // Correction: Use customer_name flattening
                     const name = item.customer_name || 'Walk-in';
                     if (!customerMap[name]) {
                         customerMap[name] = {
                             name,
                             count: 0,
                             total_spent: 0,
                             paid_amount: 0
                         };
                     }
                     customerMap[name].count += 1;
                     // Updated: Use total_price instead of total_amount
                     customerMap[name].total_spent += parseFloat(item.total_price || 0);
                     customerMap[name].paid_amount += parseFloat(item.paid_amount || 0);
                 });
                 fetchedData = Object.values(customerMap);
            } else if (reportType === 'supplier_summary') {
                 // Group by supplier
                 const supplierMap = {};
                 fetchedData.forEach(item => {
                     const name = item.supplier_name || 'Unknown';
                     if (!supplierMap[name]) {
                         supplierMap[name] = {
                             name,
                             count: 0,
                             total_spent: 0,
                             paid_amount: 0
                         };
                     }
                     supplierMap[name].count += 1;
                     supplierMap[name].total_spent += parseFloat(item.total_price || 0);
                     supplierMap[name].paid_amount += parseFloat(item.paid_amount || 0);
                 });
                 fetchedData = Object.values(supplierMap);
            }

            setData(fetchedData);

            // Calculate Summary
            let total = 0;
            if (reportType === 'customer_summary' || reportType === 'supplier_summary') {
                 total = fetchedData.reduce((sum, item) => sum + item.total_spent, 0);
            } else if (reportType === 'inventory') {
                // Inventory Value = Total Price (calculated by backend)
                total = fetchedData.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
            } else {
                 // Updated: prioritizing total_price, falling back to cost * qty for inventory
                 total = fetchedData.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
            }

            setSummary({
                total_amount: total,
                count: fetchedData.length
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text("GemInventory Report", 14, 22);

        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1).replace('_', ' ')}`, 14, 35);
        if (reportType !== 'inventory' && reportType !== 'receivables' && reportType !== 'payables' && reportType !== 'customer_summary' && reportType !== 'supplier_summary') {
            doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 40);
        }

        // Table Configuration
        let tableColumn = [];
        let tableRows = [];

        if (reportType === 'sales') {
            tableColumn = ["Date", "Item", "Customer", "Qty", "Price", "Total"];
            tableRows = data.map(item => [
                new Date(item.sale_date).toLocaleDateString(),
                item.stock_name || item.gem_name || 'Unknown Item',
                item.customer_name || 'Walk-in',
                item.quantity,
                parseFloat(item.price_per_carat || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
            ]);
        } else if (reportType === 'purchases') {
            tableColumn = ["Date", "Item", "Supplier", "Qty", "Cost", "Total"];
            tableRows = data.map(item => [
                new Date(item.purchase_date).toLocaleDateString(),
                item.stock_name || item.gem_name || 'Gemstone',
                item.supplier_name || 'Unknown',
                item.quantity,
                parseFloat(item.cost_per_carat || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
            ]);
        } else if (reportType === 'inventory') {
             tableColumn = ["SKU", "Name", "Type", "Weight (ct)", "Qty", "Cost/ct", "Total Value"];
     tableRows = data.map(item => [
        item.sku || '-',
        item.name,
        item.type,
        item.carat,
        item.quantity,
        parseFloat(item.price_per_carat || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
        parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
    ]);
        } else if (reportType === 'receivables') {
            tableColumn = ["Due Date", "Customer", "Invoice", "Total", "Paid", "Balance"];
            tableRows = data.map(item => [
                new Date(item.sale_date).toLocaleDateString(),
                item.customer_name || 'Walk-in',
                item.invoice_number,
                parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat(item.paid_amount || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat((item.total_price || 0) - (item.paid_amount || 0)).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
            ]);
        } else if (reportType === 'payables') {
            tableColumn = ["Date", "Supplier", "Item", "Total", "Paid", "Balance"];
             tableRows = data.map(item => [
                new Date(item.purchase_date).toLocaleDateString(),
                item.supplier_name || 'Unknown',
                item.stock_name || item.gem_name,
                parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat(item.paid_amount || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat((item.total_price || 0) - (item.paid_amount || 0)).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
            ]);
        } else if (reportType === 'customer_summary') {
            tableColumn = ["Customer Name", "Total Purchases", "Total Spent", "Total Paid"];
            tableRows = data.map(item => [
                item.name,
                item.count,
                parseFloat(item.total_spent || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat(item.paid_amount || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
            ]);
        } else if (reportType === 'supplier_summary') {
            tableColumn = ["Supplier Name", "Total Items", "Total Spent", "Total Paid"];
            tableRows = data.map(item => [
                item.name,
                item.count,
                parseFloat(item.total_spent || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' }),
                parseFloat(item.paid_amount || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })
            ]);
        }

        autoTable(doc, {
            startY: 50,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 45] },
            styles: { fontSize: 8 }
        });

        // Summary Footer
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Total Records: ${summary.count}`, 14, finalY);
        doc.text(`Total Value: ${summary.total_amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}`, 14, finalY + 5);

        doc.save(`geminventory_${reportType}_report.pdf`);
        toast.success("PDF Report generated successfully");
    };

    const getReportIcon = () => {
        switch(reportType) {
            case 'receivables': return <ArrowDownCircle className="w-3.5 h-3.5 mr-2" />;
            case 'payables': return <ArrowUpCircle className="w-3.5 h-3.5 mr-2" />;
            case 'customer_summary': return <Users className="w-3.5 h-3.5 mr-2" />;
            case 'supplier_summary': return <Truck className="w-3.5 h-3.5 mr-2" />;
            default: return <BarChart3 className="w-3.5 h-3.5 mr-2" />;
        }
    };

    const getReportTitle = () => {
        switch(reportType) {
            case 'receivables': return 'Total Receivables';
            case 'payables': return 'Total Payables';
            case 'customer_summary': return 'Total Customer Volume';
            case 'supplier_summary': return 'Total Supplier Volume';
            case 'inventory': return 'Inventory Value';
            default: return 'Total Volume';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Generate financial statements, inventory lists, and trade summaries.</p>
                </div>
                 <div className="flex gap-4">
                     <Card className="w-64 border-none shadow-md bg-slate-800 text-white">
                        <CardHeader className="py-4">
                             <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                                {getReportIcon()}
                                {getReportTitle()}
                            </CardTitle>
                            <div className="text-2xl font-bold mt-0.5">
                                {summary.total_amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                            </div>
                        </CardHeader>
                     </Card>
                 </div>
            </div>

            {/* Controls */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label>Report Type</Label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales">Sales Report</SelectItem>
                                    <SelectItem value="purchases">Purchases Report</SelectItem>
                                    <SelectItem value="inventory">Inventory Valuation</SelectItem>
                                    <SelectItem value="receivables">Receivables (Unpaid Sales)</SelectItem>
                                    <SelectItem value="payables">Payables (Unpaid Purchases)</SelectItem>
                                    <SelectItem value="customer_summary">Customer Summary</SelectItem>
                                    <SelectItem value="supplier_summary">Supplier Summary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {reportType !== 'inventory' && reportType !== 'receivables' && reportType !== 'payables' && reportType !== 'customer_summary' && reportType !== 'supplier_summary' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex items-end">
                            <Button
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                onClick={generatePDF}
                                disabled={loading || data.length === 0}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Preview */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-slate-500" />
                        Preview Data ({data.length} records)
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto max-h-[500px]">
                    <div className="min-w-full inline-block align-middle">
                        <div className="border-b border-slate-200 p-4">
                             {loading ? (
                                <div className="text-center py-8">Loading data...</div>
                            ) : data.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No records found for the selected criteria.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead>
                                        <tr>
                                            {reportType === 'sales' && (
                                                <>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Date</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Item</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Customer</th>
                                                    <th className="px-3 py-2 text-right font-medium text-slate-500">Amount</th>
                                                </>
                                            )}
                                            {reportType === 'purchases' && (
                                                <>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Date</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Item</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Supplier</th>
                                                    <th className="px-3 py-2 text-right font-medium text-slate-500">Cost</th>
                                                </>
                                            )}
                                            {reportType === 'inventory' && (
                                                <>
                                                     <th className="px-3 py-2 text-left font-medium text-slate-500">SKU</th>
                                                     <th className="px-3 py-2 text-left font-medium text-slate-500">Name</th>
                                                     <th className="px-3 py-2 text-left font-medium text-slate-500">Type</th>
                                                     <th className="px-3 py-2 text-left font-medium text-slate-500">Weight (ct)</th>
                                                     <th className="px-3 py-2 text-left font-medium text-slate-500">Qty</th>
                                                     <th className="px-3 py-2 text-right font-medium text-slate-500">Total Value</th>
                                                </>
                                            )}
                                            {reportType === 'receivables' && (
                                                <>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Due Date</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Customer</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Invoice</th>
                                                    <th className="px-3 py-2 text-right font-medium text-slate-500">Balance</th>
                                                </>
                                            )}
                                            {reportType === 'payables' && (
                                                <>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Date</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Supplier</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Item</th>
                                                    <th className="px-3 py-2 text-right font-medium text-slate-500">Balance</th>
                                                </>
                                            )}
                                            {reportType === 'customer_summary' && (
                                                <>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Customer Name</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Purchases</th>
                                                    <th className="px-3 py-2 text-right font-medium text-slate-500">Total Spent</th>
                                                </>
                                            )}
                                            {reportType === 'supplier_summary' && (
                                                <>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Supplier Name</th>
                                                    <th className="px-3 py-2 text-left font-medium text-slate-500">Items Supplied</th>
                                                    <th className="px-3 py-2 text-right font-medium text-slate-500">Total Spent</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                         {data.slice(0, 50).map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                {reportType === 'sales' && (
                                                    <>
                                                        <td className="px-3 py-2">{new Date(item.sale_date).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2">{item.stock_name || item.gem_name || 'Unknown'}</td>
                                                        <td className="px-3 py-2">{item.customer_name || 'Walk-in'}</td>
                                                        <td className="px-3 py-2 text-right">{parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</td>
                                                    </>
                                                )}
                                                {reportType === 'purchases' && (
                                                    <>
                                                        <td className="px-3 py-2">{new Date(item.purchase_date).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2">{item.stock_name || item.gem_name || 'Gemstone'}</td>
                                                        <td className="px-3 py-2">{item.supplier_name || 'Unknown'}</td>
                                                        <td className="px-3 py-2 text-right">{parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</td>
                                                    </>
                                                )}
                                                {reportType === 'inventory' && (
                                                    <>
                                                        <td className="px-3 py-2 font-mono text-xs">{item.sku || '-'}</td>
                                                        <td className="px-3 py-2">{item.name}</td>
                                                        <td className="px-3 py-2">{item.type}</td>
                                                        <td className="px-3 py-2">{item.carat}</td>
                                                        <td className="px-3 py-2">{item.quantity}</td>
                                                        <td className="px-3 py-2 text-right">{parseFloat(item.total_price || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</td>
                                                    </>
                                                )}
                                                {reportType === 'receivables' && (
                                                    <>
                                                        <td className="px-3 py-2">{new Date(item.sale_date).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2">{item.customer_name || 'Walk-in'}</td>
                                                        <td className="px-3 py-2 font-mono text-xs">{item.invoice_number}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-rose-600">
                                                            {parseFloat((item.total_price || 0) - (item.paid_amount || 0)).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                                                        </td>
                                                    </>
                                                )}
                                                {reportType === 'payables' && (
                                                    <>
                                                        <td className="px-3 py-2">{new Date(item.purchase_date).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2">{item.supplier_name || 'Unknown'}</td>
                                                        <td className="px-3 py-2">{item.stock_name || item.gem_name}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-rose-600">
                                                            {parseFloat((item.total_price || 0) - (item.paid_amount || 0)).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                                                        </td>
                                                    </>
                                                )}
                                                {reportType === 'customer_summary' && (
                                                    <>
                                                        <td className="px-3 py-2 font-medium">{item.name}</td>
                                                        <td className="px-3 py-2">{item.count} items</td>
                                                        <td className="px-3 py-2 text-right font-bold text-slate-700">
                                                            {parseFloat(item.total_spent || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                                                        </td>
                                                    </>
                                                )}
                                                {reportType === 'supplier_summary' && (
                                                    <>
                                                        <td className="px-3 py-2 font-medium">{item.name}</td>
                                                        <td className="px-3 py-2">{item.count} items</td>
                                                        <td className="px-3 py-2 text-right font-bold text-slate-700">
                                                            {parseFloat(item.total_spent || 0).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                         ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
                {data.length > 50 && (
                     <div className="bg-slate-50 px-4 py-2 text-center text-xs text-muted-foreground border-t">
                        Showing first 50 records. Export PDF for full details.
                     </div>
                )}
            </Card>
        </div>
    );
};

export default Reports;

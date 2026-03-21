import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Briefcase,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/dashboard");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center">
          <Activity className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">
            Crunching your business data...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your gemstone business performance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm self-start">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Live Metrics
          </span>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalSales)}
            </div>
            <p className="text-xs mt-1 opacity-70 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Lifetime sales performance
            </p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <DollarSign className="w-24 h-24" />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Asset Valuation
            </CardTitle>
            <Package className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.stockValue)}
            </div>
            <p className="text-xs mt-1 opacity-70">
              Current inventory market value
            </p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Package className="w-24 h-24" />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Account Receivables
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalReceivable)}
            </div>
            <p className="text-xs mt-1 opacity-70 font-medium">
              Expected from customers
            </p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <ArrowDownCircle className="w-24 h-24" />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-rose-500 to-red-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Account Payables
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPayable)}
            </div>
            <p className="text-xs mt-1 opacity-70">Outstanding to suppliers</p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <ArrowUpCircle className="w-24 h-24" />
          </div>
        </Card>
      </div>

      {/* Visuals Grid: Row 1 */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cash Flow Evolution (Line/Area/Bar Chart) */}
        <Card className="lg:col-span-8 border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue vs Expenditure</CardTitle>
                <CardDescription>
                  Financial performance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {stats.salesTrend && stats.salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.salesTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(v) => `LKR ${v / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6", opacity: 0.4 }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(v) => [formatCurrency(v), ""]}
                    />
                    <Legend />
                    <Bar
                      dataKey="sales"
                      name="Cash In (Sales)"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="purchases"
                      name="Cash Out (Purchases)"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  No transaction history available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Distribution by Value (Pie Chart) */}
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader>
            <CardTitle>Inventory Assets</CardTitle>
            <CardDescription>Value spread across gem types.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[300px] w-full">
              {stats.stockDistribution && stats.stockDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.stockDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="type"
                    >
                      {stats.stockDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          cornerRadius={4}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  No inventory data to display.
                </div>
              )}
            </div>
            {stats.stockDistribution && stats.stockDistribution.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full px-4">
                {stats.stockDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-[11px] font-medium text-gray-700 truncate">
                      {entry.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visuals Grid: Row 2 */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sales Volume by Category (Bar Chart) */}
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Popular Categories</CardTitle>
            <CardDescription>Items sold per gem type.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              {stats.salesByCategory && stats.salesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.salesByCategory} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="type"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                      width={80}
                    />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  No category analysis available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status (Donut Chart) */}
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Collections Health</CardTitle>
            <CardDescription>Sales status distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {stats.paymentStatusDistribution &&
              stats.paymentStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.paymentStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={10}
                      dataKey="value"
                      nameKey="status"
                    >
                      {stats.paymentStatusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === "Paid"
                              ? "#10b981"
                              : entry.status === "Partial"
                                ? "#f59e0b"
                                : "#ef4444"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  No status distribution available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Suppliers (Horizontal Bar) */}
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Strategic Partners</CardTitle>
            <CardDescription>Top suppliers by expenditure.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              {stats.topSuppliers && stats.topSuppliers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topSuppliers} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#4b5563" }}
                      width={100}
                    />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar
                      dataKey="total_value"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  No supplier metrics available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Customers & Recent Sales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Key Accounts</CardTitle>
                <CardDescription>Top contributors by revenue.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {stats.topCustomers && stats.topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topCustomers}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#4b5563", fontWeight: 500 }}
                      width={100}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      formatter={(v) => formatCurrency(v)}
                    />
                    <Bar
                      dataKey="total_spent"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  No customer data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Operations Feed</CardTitle>
                <CardDescription>Latest commercial activities.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto">
              {stats.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="bg-blue-50 p-2 rounded-lg mr-4">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {sale.gem}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      To {sale.customer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      +{formatCurrency(sale.total_price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {stats.recentSales.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No recent operations detected.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Customer Base
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-violet-50 p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Supplier Base
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-gray-100 ring-red-100 border-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase text-red-600">
                  Low Stock Alerts
                </p>
                <p className="text-2xl font-bold text-red-700">
                  {stats.lowStockCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

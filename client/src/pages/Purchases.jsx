import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Truck,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  CheckCircle,
  ArrowUpCircle,
  Package,
  Briefcase,
  Gem,
  History,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "purchase_date",
    direction: "desc",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    supplier_id: "",
    name: "",
    type: "",
    color: "",
    clarity: "",
    carat: "",
    cut: "",
    quantity: "",
    price_per_carat: "",
    paid_amount: "",
    payment_method: "Cash",
    description: "",
    condition: "Natural",
    purchase_date: new Date().toISOString().split('T')[0],
  });
  const [image, setImage] = useState(null); // Image file state

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, stocksRes, suppliersRes] = await Promise.all([
        axios.get("/api/purchases"),
        axios.get("/api/stocks"),
        axios.get("/api/suppliers"),
      ]);
      setPurchases(purchasesRes.data);
      setStocks(stocksRes.data);
      setSuppliers(suppliersRes.data);
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

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    if (image) {
      data.append("image", image);
    }

    if (formData.purchase_date && new Date(formData.purchase_date) > new Date()) {
      toast.error("Purchase date cannot be in the future");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingPurchase) {
        await axios.put(`/api/purchases/${editingPurchase.id}`, formData);
        toast.success("Purchase & Stock updated successfully!");
      } else {
        await axios.post("/api/purchases", data, {
          headers: editingPurchase
            ? {}
            : { "Content-Type": "multipart/form-data" }, // New purchase has image
        });
        toast.success("Purchase & Stock recorded successfully!");
      }
      setIsAddOpen(false);
      setEditingPurchase(null);
      setFormData({
        supplier_id: "",
        name: "",
        type: "",
        color: "",
        clarity: "",
        carat: "",
        cut: "",
        quantity: "",
        price_per_carat: "",
        paid_amount: "",
        payment_method: "Cash",
        description: "",
        condition: "Natural",
        purchase_date: new Date().toISOString().split('T')[0],
      });
      setImage(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to record purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (purchase) => {
    try {
      await axios.patch(`/api/purchases/${purchase.id}/payment`, {
        paid_amount: purchase.total_price,
      });
      toast.success("Purchase marked as fully paid!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment status");
    }
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier_id: purchase.supplier_id,
      name: purchase.gem_name,
      type: purchase.type || "",
      color: purchase.color || "",
      clarity: purchase.clarity || "",
      carat: purchase.carat || "",
      cut: purchase.cut || "",
      quantity: purchase.quantity,
      price_per_carat:
        purchase.gem_price_per_carat ||
        purchase.total_price / purchase.quantity / (purchase.carat || 1),
      paid_amount: purchase.paid_amount,
      payment_method: purchase.payment_method,
      description: purchase.description || "",
      condition: purchase.condition || "Natural",
      purchase_date: purchase.purchase_date ? new Date(purchase.purchase_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    // Note: For now, assuming purchases list has basic info.
    // If some data is missing from the list JOIN, we might need a better JOIN in getAllPurchases
    setIsAddOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure? Deleting this purchase will subtract the quantity from your available stock.",
      )
    ) {
      try {
        await axios.delete(`/api/purchases/${id}`);
        toast.success("Purchase record removed and stock reverted");
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete purchase");
      }
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredData = useMemo(() => {
    let data = [...purchases];
    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.supplier_name?.toLowerCase().includes(query) ||
          item.gem_name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      );
    }
    // Status Filter
    if (filterStatus !== "all") {
      data = data.filter((item) => item.payment_status === filterStatus);
    }
    // Sorting
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else {
        valA = parseFloat(valA || 0);
        valB = parseFloat(valB || 0);
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [purchases, searchQuery, sortConfig, filterStatus]);

  const stats = useMemo(() => {
    const totalSpend = purchases.reduce(
      (sum, p) => sum + parseFloat(p.total_price),
      0,
    );
    const totalPaid = purchases.reduce(
      (sum, p) => sum + parseFloat(p.paid_amount || 0),
      0,
    );
    const pending = totalSpend - totalPaid;
    return { totalSpend, pending, count: purchases.length };
  }, [purchases]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Purchases
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage gemstone acquisitions, supplier payments, and restock logs.
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="hidden lg:block w-60 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-rose-600 to-red-700 text-white">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                <ArrowUpCircle className="w-3.5 h-3.5 mr-2" />
                Total Outbound
              </CardTitle>
              <div className="text-2xl font-bold mt-0.5">
                {formatCurrency(stats.totalSpend)}
              </div>
            </CardHeader>
          </Card>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-rose-600 hover:bg-rose-700 h-12 px-6 shadow-lg shadow-rose-100 transition-all active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Truck className="w-6 h-6 text-rose-600" />
                  {editingPurchase
                    ? "Modify Purchase"
                    : "New Stock Purchase"}
                </DialogTitle>
                <DialogDescription>
                  {editingPurchase
                    ? "Update purchase and gemstone details."
                    : "Enter details of the gemstone restock from your supplier."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier_id">Authorized Supplier</Label>
                      <select
                        id="supplier_id"
                        name="supplier_id"
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-rose-500 transition-all"
                        value={formData.supplier_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a Supplier</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Gemstone Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        placeholder="Blue Sapphire"
                        required
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="purchase_date">Purchase Date</Label>
                       <Input
                         id="purchase_date"
                         name="purchase_date"
                         type="date"
                         value={formData.purchase_date}
                         onChange={handleChange}
                         className="h-11"
                         max={new Date().toISOString().split('T')[0]}
                         required
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type (Variety)</Label>
                      <Input
                        id="type"
                        name="type"
                        value={formData.type}
                        placeholder="Sapphire"
                        required
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carat">Weight (Carats)</Label>
                      <Input
                        id="carat"
                        name="carat"
                        type="number"
                        step="0.01"
                        value={formData.carat}
                        placeholder="1.0"
                        required
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        name="color"
                        value={formData.color}
                        placeholder="Royal Blue"
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cut">Cut</Label>
                      <Input
                        id="cut"
                        name="cut"
                        value={formData.cut}
                        placeholder="Oval"
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clarity">Clarity</Label>
                      <select
                        id="clarity"
                        name="clarity"
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-rose-500 transition-all"
                        value={formData.clarity}
                        onChange={handleChange}
                      >
                        <option value="">Select Clarity</option>
                        <option value="FL">FL - Flawless</option>
                        <option value="VVS">
                          VVS - Very, very small inclusions
                        </option>
                        <option value="VS">VS - Very small inclusions</option>
                        <option value="SI">SI - Slightly included</option>
                        <option value="I">I - Included</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <select
                          id="condition"
                          name="condition"
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-rose-500 transition-all"
                          value={formData.condition}
                          onChange={handleChange}
                        >
                          <option value="Natural">Natural</option>
                          <option value="Heated">Heated</option>
                        </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">
                      Gemstone Image{" "}
                      {!editingPurchase && (
                        <span className="text-rose-500">*</span>
                      )}
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="h-11 pt-2"
                      disabled={!!editingPurchase}
                    />
                    {editingPurchase && (
                      <p className="text-[10px] text-muted-foreground italic">
                        Image cannot be changed during purchase edit.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Purchase Notes / Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Optional notes about quality, origin..."
                      className="h-11"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity (Pieces)</Label>
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
                      <Label htmlFor="price_per_carat">
                        Cost Price/Ct (LKR)
                      </Label>
                      <Input
                        id="price_per_carat"
                        name="price_per_carat"
                        type="number"
                        step="0.01"
                        className="h-11"
                        value={formData.price_per_carat}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="p-5 border rounded-xl bg-rose-50/50 border-rose-100 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-rose-900 uppercase tracking-tight">
                      Financial settlement
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <select
                          id="payment_method"
                          name="payment_method"
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-rose-500 transition-all"
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
                        <Label htmlFor="paid_amount">
                          Advance Payment (LKR)
                        </Label>
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
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-lg shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : editingPurchase ? (
                      "Update Purchase"
                    ) : (
                      "Confirm Purchase"
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
        <Card className="border-none shadow-sm bg-rose-50 border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-rose-100 p-3 rounded-xl">
                <History className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                  Outstanding Liability
                </p>
                <p className="text-2xl font-bold text-rose-900">
                  {formatCurrency(stats.pending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gray-50 border-l-4 border-l-gray-400">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-200 p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Acquisitions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.count} Records
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-orange-50 border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                  Total Pieces
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {purchases.reduce((sum, p) => sum + parseInt(p.quantity), 0)}{" "}
                  Pieces
                </p>
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
            placeholder="Search by supplier, gemstone or description..."
            className="pl-10 h-11 bg-white border-gray-200 focus:ring-rose-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {["all", "Paid", "Partial", "Unpaid"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-11 px-4 flex-1 md:flex-none capitalize font-medium",
                filterStatus === status
                  ? "bg-rose-600 shadow-md shadow-rose-100"
                  : "bg-white text-gray-600 hover:bg-gray-50",
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
                    <button
                      onClick={() => handleSort("purchase_date")}
                      className="flex items-center hover:text-rose-600 transition-colors uppercase text-[10px] font-bold tracking-widest"
                    >
                      Date <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("supplier_name")}
                      className="flex items-center hover:text-rose-600 transition-colors uppercase text-[10px] font-bold tracking-widest"
                    >
                      Supplier <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="uppercase text-[10px] font-bold tracking-widest">
                    SKU
                  </TableHead>
                  <TableHead className="uppercase text-[10px] font-bold tracking-widest">
                    Item
                  </TableHead>
                  <TableHead className="text-center uppercase text-[10px] font-bold tracking-widest">
                    Qty
                  </TableHead>
                  <TableHead className="uppercase text-[10px] font-bold tracking-widest">
                    Status
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("total_price")}
                      className="flex items-center justify-end w-full hover:text-rose-600 transition-colors uppercase text-[10px] font-bold tracking-widest"
                    >
                      Total Cost <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right uppercase text-[10px] font-bold tracking-widest">
                    Liability
                  </TableHead>
                  <TableHead className="w-[120px] text-right uppercase text-[10px] font-bold tracking-widest">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-48">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-rose-500 animate-spin" />
                        <p className="text-muted-foreground font-medium">
                          Fetching procurement logs...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedAndFilteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center h-48 text-muted-foreground italic"
                    >
                      No procurement records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredData.map((p) => {
                    const total = parseFloat(p.total_price);
                    const paid = parseFloat(p.paid_amount || 0);
                    const due = total - paid;
                    return (
                      <TableRow
                        key={p.id}
                        className="hover:bg-rose-50/30 transition-colors group"
                      >
                        <TableCell className="font-medium text-gray-500 text-xs">
                          {new Date(p.purchase_date).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-gray-900">
                          {p.supplier_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium text-gray-400">
                          {p.sku || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Gem className="w-3 h-3 text-rose-400" />
                            <span className="text-sm font-medium">
                              {p.gem_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {p.quantity}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              p.payment_status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : p.payment_status === "Partial"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-rose-50 text-rose-700 border-rose-100",
                            )}
                          >
                            {p.payment_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-bold",
                            due > 0 ? "text-rose-600" : "text-emerald-600",
                          )}
                        >
                          {due > 0 ? formatCurrency(due) : "Settled"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit Purchase"
                              onClick={() => handleEdit(p)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {due > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Mark as Paid"
                                onClick={() => handleMarkAsPaid(p)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Delete Purchase"
                              onClick={() => handleDelete(p.id)}
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

export default Purchases;

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  UserPlus,
  Briefcase,
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

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeReceivables: 0,
    newCustomers30d: 0,
  });

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/customers/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch customer stats", err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/customers");
      setCustomers(res.data);
    } catch (err) {
      toast.error("Failed to fetch customers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "" });
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        // Update
        await axios.put(`/api/customers/${selectedCustomer.id}`, formData);
        toast.success("Customer updated successfully");
      } else {
        // Add
        await axios.post("/api/customers", formData);
        toast.success("Customer added successfully");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      resetForm();
      fetchCustomers();
      fetchStats();
    } catch (err) {
      toast.error(
        selectedCustomer
          ? "Failed to update customer"
          : "Failed to add customer",
      );
      console.error(err);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure? This will permanently remove the customer record.",
      )
    ) {
      try {
        await axios.delete(`/api/customers/${id}`);
        toast.success("Customer deleted");
        fetchCustomers();
        fetchStats();
      } catch (err) {
        toast.error("Failed to delete customer");
        console.error(err);
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
    let data = [...customers];
    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.phone?.toLowerCase().includes(query),
      );
    }
    // Sorting
    data.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [customers, searchQuery, sortConfig]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Customers
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Details of your clients and business contacts.
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="hidden lg:block w-56 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                <Users className="w-3.5 h-3.5 mr-2" />
                Total Base
              </CardTitle>
              <div className="text-2xl font-bold mt-0.5">
                {customers.length} Accounts
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
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 shadow-lg shadow-emerald-100 transition-all active:scale-95">
                <UserPlus className="w-5 h-5 mr-2" />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2 text-emerald-700">
                  <User className="w-6 h-6" />
                  Register New Customer
                </DialogTitle>
                <DialogDescription>
                  Create a profile for new trade partners or private clients.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name / Company Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter name..."
                      className="h-11"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@mail.com"
                        className="h-11"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+94 ..."
                        className="h-11"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Registered Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Location details..."
                      className="h-11"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg shadow-md shadow-emerald-100 transition-all"
                  >
                    Register Customer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Insights Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-sm bg-rose-50 border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-rose-100 p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                  Receivables
                </p>
                <p className="text-2xl font-bold text-rose-900">
                  LKR {stats.activeReceivables.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Recent Boarding
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.newCustomers30d} New
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-teal-50 border-l-4 border-l-teal-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-xl">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  Total Base
                </p>
                <p className="text-2xl font-bold text-teal-900">
                  {stats.totalCustomers} Accounts
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
            placeholder="Search by name, email or mobile..."
            className="pl-10 h-12 bg-white border-gray-200 focus:ring-emerald-500 rounded-xl shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50/50">
                  <TableHead className="w-[300px]">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-emerald-600 transition-colors uppercase text-[10px] font-bold tracking-widest px-2"
                    >
                      Vendor/Company <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center hover:text-emerald-600 transition-colors uppercase text-[10px] font-bold tracking-widest px-2"
                    >
                      Contact Email <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("phone")}
                      className="flex items-center hover:text-emerald-600 transition-colors uppercase text-[10px] font-bold tracking-widest px-2"
                    >
                      Mobile <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="uppercase text-[10px] font-bold tracking-widest px-2">
                    Address
                  </TableHead>
                  <TableHead className="w-[100px] text-right uppercase text-[10px] font-bold tracking-widest px-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-48">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-emerald-500 animate-pulse" />
                        <p className="text-muted-foreground font-medium">
                          Accessing customer logs...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedAndFilteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-48 text-muted-foreground italic"
                    >
                      No matching customer records identified.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredData.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      <TableCell className="font-bold text-gray-900 py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {customer.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {customer.address || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg shadow-emerald-50"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shadow-rose-50"
                            onClick={() => handleDelete(customer.id)}
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

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-emerald-700">
              <Edit className="w-6 h-6" />
              Update Customer Profile
            </DialogTitle>
            <DialogDescription>
              Modify existing records for this client account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name / Company Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  className="h-11 border-gray-200 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    className="h-11 border-gray-200 focus:ring-emerald-500"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Contact Number</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    className="h-11 border-gray-200 focus:ring-emerald-500"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Registered Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  className="h-11 border-gray-200 focus:ring-emerald-500"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg shadow-md shadow-emerald-100 transition-all"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;

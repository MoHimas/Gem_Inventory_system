import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  Trash2,
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Star,
  Activity,
  UserPlus,
  ExternalLink,
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

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activePayables: 0,
    newSuppliers30d: 0,
  });

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/suppliers/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch supplier stats", err);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      toast.error("Failed to fetch suppliers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    });
    setSelectedSupplier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        // Update
        await axios.put(`/api/suppliers/${selectedSupplier.id}`, formData);
        toast.success("Supplier profile updated successfully");
      } else {
        // Add
        await axios.post("/api/suppliers", formData);
        toast.success("New supplier onboarded successfully");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      resetForm();
      fetchSuppliers();
      fetchStats();
    } catch (err) {
      toast.error(
        selectedSupplier
          ? "Failed to update supplier"
          : "Failed to record supplier",
      );
      console.error(err);
    }
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone,
      address: supplier.address || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure? This will remove the supplier and all associated contact records.",
      )
    ) {
      try {
        await axios.delete(`/api/suppliers/${id}`);
        toast.success("Supplier removed from system");
        fetchSuppliers();
        fetchStats();
      } catch (err) {
        toast.error("Failed to delete supplier");
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
    let data = [...suppliers];
    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.contact_person?.toLowerCase().includes(query) ||
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
  }, [suppliers, searchQuery, sortConfig]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Suppliers
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage gemstone sources, mining partners, and supply chain contacts.
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="hidden lg:block w-56 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-500 to-orange-700 text-white">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-2" />
                Supply Partners
              </CardTitle>
              <div className="text-2xl font-bold mt-0.5">
                {suppliers.length} Registered
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
              <Button className="bg-amber-600 hover:bg-amber-700 h-12 px-6 shadow-lg shadow-amber-100 transition-all active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2 text-amber-700">
                  <Truck className="w-6 h-6" />
                  Register Supplier
                </DialogTitle>
                <DialogDescription>
                  Register a new gemstone source or mining company in your
                  network.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company / Vendor</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="E.g. Sapphire Mines Ltd"
                      className="h-11 border-gray-200 focus:ring-amber-500 rounded-xl"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Key Contact Person</Label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      placeholder="Full name of representative"
                      className="h-11 border-gray-200 focus:ring-amber-500 rounded-xl"
                      value={formData.contact_person}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="vendor@example.com"
                        className="h-11 border-gray-200 focus:ring-amber-500 rounded-xl"
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
                        className="h-11 border-gray-200 focus:ring-amber-500 rounded-xl"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Office / Mine Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Location details..."
                      className="h-11 border-gray-200 focus:ring-amber-500 rounded-xl"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-lg shadow-md shadow-amber-100 transition-all"
                  >
                    Register Supplier
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
                <Activity className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                  Pending Payables
                </p>
                <p className="text-2xl font-bold text-rose-900">
                  ${stats.activePayables.toLocaleString()}
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
                  {stats.newSuppliers30d} New
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-teal-50 border-l-4 border-l-teal-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-xl">
                <Building2 className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  Total Partners
                </p>
                <p className="text-2xl font-bold text-teal-900">
                  {stats.totalSuppliers} Registered
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
            placeholder="Search by vendor name, representative or email..."
            className="pl-10 h-12 bg-white border-gray-200 focus:ring-amber-500 rounded-xl shadow-sm"
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
                      className="flex items-center hover:text-amber-600 transition-colors uppercase text-[10px] font-bold tracking-widest px-2"
                    >
                      Vendor / Company <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("contact_person")}
                      className="flex items-center hover:text-amber-600 transition-colors uppercase text-[10px] font-bold tracking-widest px-2"
                    >
                      Representative <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center hover:text-amber-600 transition-colors uppercase text-[10px] font-bold tracking-widest px-2"
                    >
                      Contact Email <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px] text-right uppercase text-[10px] font-bold tracking-widest px-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-48">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="w-8 h-8 text-amber-500 animate-pulse" />
                        <p className="text-muted-foreground font-medium">
                          Syncing supply chain logs...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedAndFilteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center h-48 text-muted-foreground italic"
                    >
                      No procurement partners matched your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredData.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      <TableCell className="font-bold text-gray-900 py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          {supplier.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-amber-500/60" />
                          {supplier.contact_person || "Company Generic"}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {supplier.email || "—"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {supplier.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg shadow-amber-50"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shadow-rose-50"
                            onClick={() => handleDelete(supplier.id)}
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
            <DialogTitle className="text-2xl flex items-center gap-2 text-amber-700">
              <Edit className="w-6 h-6" />
              Update Supplier Profile
            </DialogTitle>
            <DialogDescription>
              Modify existing records for this procurement partner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Company Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  className="h-11 border-gray-200 focus:ring-amber-500"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Representative</Label>
                <Input
                  id="edit-contact"
                  name="contact_person"
                  className="h-11 border-gray-200 focus:ring-amber-500"
                  value={formData.contact_person}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    className="h-11 border-gray-200 focus:ring-amber-500"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Mobile Number</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    className="h-11 border-gray-200 focus:ring-amber-500"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Location Details</Label>
                <Input
                  id="edit-address"
                  name="address"
                  className="h-11 border-gray-200 focus:ring-amber-500"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-lg shadow-md shadow-amber-100 transition-all font-bold"
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

export default Suppliers;

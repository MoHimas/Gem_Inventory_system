import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/formatCurrency";
import { Search, ArrowUpDown, Gem, Box, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const fetchStocks = async () => {
    try {
      const res = await axios.get("/api/stocks");
      setStocks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredData = useMemo(() => {
    let data = [...stocks];

    // Search Filter
    if (searchQuery) {
      data = data.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.color?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sorting
    data.sort((a, b) => {
      // 1. Primary Sort: Availability (Zeros at the end)
      const qtyA = parseInt(a.quantity || 0);
      const qtyB = parseInt(b.quantity || 0);

      if (qtyA > 0 && qtyB === 0) return -1;
      if (qtyA === 0 && qtyB > 0) return 1;

      // 2. Secondary Sort: User's config
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
  }, [stocks, searchQuery, sortConfig]);

  const totalInventoryValue = useMemo(() => {
    return stocks.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0);
  }, [stocks]);

  return (
    <div className="space-y-4 pb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Inventory Portfolio
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your gemstone collection and valuation in real-time.
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="hidden lg:block w-64 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                Portfolio Value
              </CardTitle>
              <div className="text-2xl font-bold mt-0.5">
                {formatCurrency(totalInventoryValue)}
              </div>
            </CardHeader>
            <div className="absolute -right-2 -bottom-2 opacity-10">
              <Layers className="w-16 h-16" />
            </div>
          </Card>
        </div>
      </div>

      {/* Controls Section */}
      <div className="grid gap-2 md:grid-cols-12 items-center">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, type, or color..."
            className="pl-10 h-11 bg-white border-gray-200 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <p className="text-sm font-medium text-gray-500">
            Analyzing{" "}
            <span className="text-indigo-600 font-bold">
              {sortedAndFilteredData.length}
            </span>{" "}
            individual gems
          </p>
        </div>
      </div>

      {/* Table Section */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">Live Inventory</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50/30">
                  <TableHead className="w-[80px]">SKU</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold tracking-widest text-indigo-900/50">
                    Image
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-indigo-600 transition-colors"
                    >
                      Gemstone <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cut</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Clarity</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("carat")}
                      className="flex items-center hover:text-indigo-600 transition-colors"
                    >
                      Carat <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price/Ct</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("total_price")}
                      className="flex items-center justify-end w-full hover:text-indigo-600 transition-colors"
                    >
                      Total Value <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-48">
                      <div className="flex flex-col items-center gap-2">
                        <Gem className="w-8 h-8 text-indigo-500 animate-pulse" />
                        <p className="text-muted-foreground font-medium">
                          Scanning inventory...
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
                      No matching gemstones found in inventory.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredData.map((stock) => (
                    <TableRow
                      key={stock.id}
                      className={cn(
                        "transition-colors group",
                        parseInt(stock.quantity) === 0
                          ? "bg-gray-50/50 hover:bg-gray-100/50 grayscale-[0.5] opacity-80"
                          : "hover:bg-indigo-50/30",
                      )}
                    >
                      <TableCell
                        className={cn(
                          "font-mono text-[10px] sm:text-xs font-medium pl-4",
                          parseInt(stock.quantity) === 0
                            ? "text-gray-400/50"
                            : "text-gray-400",
                        )}
                      >
                        {stock.sku || "-"}
                      </TableCell>
                      <TableCell className="py-2">
                        {stock.image_url ? (
                          <div
                            className="relative w-8 h-8 cursor-zoom-in group/img"
                            onClick={() => setPreviewImage(stock.image_url)}
                          >
                            <img
                              src={stock.image_url}
                              alt={stock.name}
                              className="w-full h-full object-cover rounded-lg shadow-sm ring-1 ring-gray-200 group-hover/img:ring-indigo-400 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                              <Search className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center border border-dashed border-gray-300">
                            <Gem className="w-4 h-4 text-gray-400 opacity-50" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-sm text-gray-900">
                        {stock.name}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {stock.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-indigo-600/80">
                        {stock.cut || "-"}
                      </TableCell>
                      <TableCell className="text-xs">{stock.color}</TableCell>
                      <TableCell className="text-gray-600 italic text-[10px] sm:text-xs">
                        {stock.clarity || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            stock.condition === "Natural"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100",
                          )}
                        >
                          {stock.condition || "Natural"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {stock.carat} ct
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            parseInt(stock.quantity) === 0
                              ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                              : parseInt(stock.quantity) < 5
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {parseInt(stock.quantity) === 0
                            ? "OUT"
                            : stock.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-xs font-medium">
                        {formatCurrency(stock.price_per_carat)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-indigo-700">
                        {formatCurrency(stock.total_price)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none sm:rounded-2xl">
          <div className="relative group">
            <img
              src={previewImage}
              alt="Gemstone Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/20"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stocks;

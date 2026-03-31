import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Download, User, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get("/api/invoices");
      setInvoices(res.data);
    } catch (err) {
      toast.error("Failed to fetch invoices");
    }
  };

  const handleDownload = async (id) => {
    try {
      // Fetch full details
      const res = await axios.get(`/api/invoices/${id}`);
      const invoice = res.data;

      const doc = new jsPDF();

      // -- Header --
      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text("INVOICE", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 30);
      doc.text(
        `Date: ${new Date(invoice.sale_date).toLocaleDateString()}`,
        14,
        35,
      );
      doc.text(`Status: ${invoice.payment_status}`, 14, 40);

      // -- Bill To --
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text("Bill To:", 140, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(invoice.customer_name || "Walk-in Customer", 140, 26);
      if (invoice.customer_email) doc.text(invoice.customer_email, 140, 31);
      if (invoice.customer_address) {
        const addressLines = doc.splitTextToSize(invoice.customer_address, 60);
        doc.text(addressLines, 140, 36);
      }

      // -- Table --
      const tableRows = [
        [
          invoice.sku || "-",
          invoice.item_name,
          invoice.item_type || "-",
          invoice.carat || "-",
          invoice.cut || "-",
          invoice.color || "-",
          invoice.clarity || "-",
          invoice.quantity,
          parseFloat(invoice.total_price || 0).toLocaleString("en-LK", {
            style: "currency",
            currency: "LKR",
          }),
        ],
      ];

      autoTable(doc, {
        startY: 60,
        head: [
          [
            "SKU",
            "Item",
            "Type",
            "Carat",
            "Cut",
            "Color",
            "Clarity",
            "Qty",
            "Total",
          ],
        ],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66], fontSize: 8 },
        styles: { fontSize: 8 },
      });

      // -- Totals --
      const finalY = doc.lastAutoTable.finalY + 10;
      const total = parseFloat(invoice.total_price || 0);
      const paid = parseFloat(invoice.paid_amount || 0);
      const balance = total - paid;

      doc.text(
        `Total Amount: ${total.toLocaleString("en-LK", { style: "currency", currency: "LKR" })}`,
        140,
        finalY,
      );
      doc.text(
        `Paid Amount: ${paid.toLocaleString("en-LK", { style: "currency", currency: "LKR" })}`,
        140,
        finalY + 5,
      );

      doc.setFont(undefined, "bold");
      doc.text(
        `Balance Due: ${balance.toLocaleString("en-LK", { style: "currency", currency: "LKR" })}`,
        140,
        finalY + 12,
      );

      // Save
      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
      toast.success("Invoice downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 p-2.3 rounded-xl">
            <FileText className="w-8 h-8 text-gray-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Invoices
            </h1>
            <p className="text-muted-foreground text-sm">
              Review and download your sales Invoices.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className="text-lg font-bold text-gray-800">
            Available Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileText className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-muted-foreground text-center font-medium italic">
                No commercial invoices found in transition logs.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {invoice.invoice_number}
                      </p>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {new Date(invoice.sale_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex items-center text-sm">
                        <div className="bg-slate-100 p-1.5 rounded-md mr-2">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <span className="font-bold text-gray-700">
                          {invoice.customer_name}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="bg-indigo-100 p-1.5 rounded-md mr-2">
                          <Gem className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-600 italic">
                          {invoice.item_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleDownload(invoice.id)}
                      className="w-full md:w-auto h-11 px-6 font-bold text-blue-600 border-blue-200 bg-white hover:bg-blue-50 hover:text-blue-700 shadow-sm transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
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
export default Invoices;

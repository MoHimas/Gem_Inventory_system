import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  RefreshCcw,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const decisionsData = [
  {
    category: "Cash Flow",
    icon: DollarSign,
    color: "emerald",
    items: [
      {
        id: "velocity",
        title: "Sales Velocity",
        description:
          "AI analyzes which specific attribute combinations (e.g., 1ct + Cushion + Blue) move the fastest.",
      },
      {
        id: "dead_stock",
        title: "Dead Stock",
        description:
          "AI identifies high-value gems that have been in stock for over 45 days.",
      },
    ],
  },
  {
    category: "Value-Add",
    icon: Sparkles,
    color: "blue",
    items: [
      {
        id: "matched_pair",
        title: "Matched Pairs",
        description:
          "AI scans your entire stock to find stones with 90%+ matching Color, Clarity, Carat, and Dimensions.",
      },
      {
        id: "recutting",
        title: "Recutting",
        description:
          "AI identifies stones with poor 'Cut' attributes but high 'Color/Clarity' that have been sitting idle.",
      },
    ],
  },
  {
    category: "Market Trends",
    icon: TrendingUp,
    color: "indigo",
    items: [
      {
        id: "clarity_roi",
        title: "Clarity ROI",
        description: "AI looks at your profit margins per Clarity grade.",
      },
      {
        id: "hue_shift",
        title: "Color Demand",
        description:
          "AI detects seasonal shifts in color preferences based on recent inquiries and sales.",
      },
    ],
  },
  {
    category: "Risk Analysis",
    icon: AlertTriangle,
    color: "rose",
    items: [
      {
        id: "concentration",
        title: "Risk Warning",
        description:
          "AI calculates your financial exposure to a single gemstone type.",
      },
      {
        id: "supplier_reliability",
        title: "Supplier Pivot",
        description:
          "AI compares the quality (Clarity/Color) of stones received vs. their return or stagnant rate.",
      },
    ],
  },
  {
    category: "Liquidity",
    icon: ShieldCheck,
    color: "indigo",
    items: [
      {
        id: "receivables_risk",
        title: "Receivables",
        description:
          "AI analyzes outstanding customer balances and payment trends to identify recovery priorities.",
      },
      {
        id: "payables_strategy",
        title: "Payables",
        description:
          "AI evaluates upcoming supplier payments and stock performance to optimize cash outflow.",
      },
    ],
  },
];

const AIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const contentRef = useRef(null);

  const fetchSpecificInsight = async (id) => {
    setLoading(true);
    setActiveTab(id);
    setErrorMsg("");
    try {
      // Smooth scroll to content area
      setTimeout(() => {
        contentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      const res = await axios.post("/api/ai-insights", { type: id });
      setInsights(res.data.answer);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error === "QUOTA_EXCEEDED") {
        toast.error("AI Daily Limit Reached", {
          description:
            "You've used all 1,500 daily requests. Please try again tomorrow or upgrade your AI plan.",
        });
      } else if (err.response?.data?.error === "NO_DATA") {
        setInsights(
          "### NO RECORDED DATA FOUND\n\nIt appears you haven't added any inventory or recorded any sales yet. \n\nTo generate AI-powered decision intelligence, please:\n1.  **Add Gemstones** to your inventory.\n2.  **Record Purchases** from suppliers.\n3.  **Log Sales** to customers.\n\nOnce you have some data, I can analyze your portfolio and provide strategic insights.",
        );
        toast.info("No data found for analysis.");
      } else {
        toast.error("Generation failed. Intelligence engine offline.");
      }
    } finally {
      setLoading(false);
    }
  };

  // No default insights on mount - user must select a card
  useEffect(() => {}, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              AI Insights
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-lg">
            AI-powered strategic insights based on your portfolio.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {decisionsData.map((categoryData, idx) => {
          const Icon = categoryData.icon;
          return (
            <div key={idx} className="space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 bg-${categoryData.color}-100 rounded-xl shadow-sm`}
                >
                  <Icon className={`w-6 h-6 text-${categoryData.color}-600`} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {categoryData.category}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categoryData.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => fetchSpecificInsight(item.id)}
                    disabled={loading}
                    className={cn(
                      "text-left overflow-hidden border-2 rounded-xl shadow-sm transition-all duration-300 group",
                      activeTab === item.id
                        ? `border-${categoryData.color}-500 bg-${categoryData.color}-50/50 shadow-md scale-[1.02]`
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md bg-white",
                      loading &&
                        activeTab !== item.id &&
                        "opacity-50 grayscale cursor-not-allowed",
                    )}
                  >
                    <div className="border-b border-slate-100/50 pb-4 px-6 pt-6">
                      <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {loading && activeTab === item.id ? (
                          <RefreshCcw
                            className={`w-5 h-5 animate-spin text-${categoryData.color}-500`}
                          />
                        ) : (
                          <Zap
                            className={`w-5 h-5 text-${categoryData.color}-500 group-hover:animate-pulse`}
                          />
                        )}
                        {item.title}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm font-medium text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-4 py-1">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div
        ref={contentRef}
        className={`grid grid-cols-1 gap-8 ${activeTab ? "opacity-100" : "opacity-50 grayscale"} transition-all duration-500`}
      >
        {/* Main Insight Console */}
        <Card className="border-none shadow-2xl ring-1 ring-slate-200 bg-white min-h-[600px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-black text-slate-900 uppercase">
                  {activeTab
                    ? `Strategic Analysis: ${activeTab.replace("_", " ")}`
                    : "Select a Strategy Card"}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    loading
                      ? "bg-amber-500 animate-pulse"
                      : activeTab
                        ? "bg-emerald-500"
                        : "bg-slate-300",
                  )}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {loading
                    ? "Synthesizing..."
                    : activeTab
                      ? "Strategy Ready"
                      : "Awaiting Input"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full py-32 space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Generating Focused Insight...
                    </h3>
                    <p className="text-slate-500 text-sm font-medium italic">
                      AI is applying strategic logic to your specific record
                      data.
                    </p>
                  </div>
                </motion.div>
              ) : insights ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto w-full"
                >
                  <div className="bg-white border-2 border-slate-100 p-10 rounded-3xl shadow-xl shadow-slate-200/50 space-y-10">
                    {/* Strategic Insight Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Strategic Insight
                      </div>
                      <div className="h-[1px] bg-slate-900/10 w-full" />
                      <div className="space-y-4">
                        <p className="text-2xl font-black text-slate-900 leading-tight">
                          {insights.insight_summary}
                        </p>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                          {insights.ai_explanation}
                        </p>
                      </div>
                    </div>

                    {/* Key Findings Section */}
                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Key Findings
                      </div>
                      <ul className="space-y-3">
                        {insights.key_findings?.map((finding, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-slate-700 font-bold group"
                          >
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                            <span className="text-base leading-snug">
                              {finding}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="h-[1px] bg-slate-100 w-full" />

                    {/* Decision Section */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Recommended Decision
                      </span>
                      <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-2xl">
                        <p className="text-xl font-bold text-slate-900 leading-relaxed">
                          {insights.decision}
                        </p>
                      </div>
                    </div>

                    {/* Expected Impact Section */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                        Expected Impact
                      </span>
                      <p className="text-lg font-bold text-emerald-700/80 leading-relaxed">
                        {insights.expected_impact}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-32 text-center space-y-4"
                >
                  <div className="p-4 bg-slate-50 rounded-full">
                    <TrendingUp className="w-12 h-12 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Intelligence Engine Standing By
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                      Select a specific decision card from the categories above
                      to analyze your portfolio and generate an actionable AI
                      Insight.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsights;

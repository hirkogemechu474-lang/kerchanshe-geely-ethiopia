"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { getAvailabilityBadge } from "@/lib/partsData";
import { Search, Filter, ShoppingCart, Shield, Truck, Store, Star, X, Loader2, Plus, Minus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { withBasePath } from "@/lib/publicPath";

const benefitIcons: Record<string, any> = {
  Shield,
  Truck,
  ShoppingCart,
  Store,
  Star,
};

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

interface Brand {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
}

interface Benefit {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  partCategory: Category | null;
  description: string | null;
  imageUrl: string | null;
  brand: string | null;
  stock: number;
  reorderPoint: number;
  price: number;
  isFeatured: boolean;
  partCategoryId: string | null;
}

interface PartsContent {
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBannerImage: string | null;
  heroBackgroundImage: string | null;
  introHeading: string | null;
  introDescription: string | null;
  ctaTitle: string | null;
  ctaDescription: string | null;
  ctaButtonText: string | null;
  ctaButtonLink: string | null;
}

interface PartsData {
  content: PartsContent | null;
  categories: Category[];
  parts: Part[];
  brands: Brand[];
  benefits: Benefit[];
}

interface CartItem {
  partId: string;
  quantity: number;
}

const toAvailability = (part: Part): "in-stock" | "limited" | "out-of-stock" => {
  if (part.stock <= 0) return "out-of-stock";
  if (part.stock < part.reorderPoint) return "limited";
  return "in-stock";
};

export default function PartsPage() {
  const [data, setData] = useState<PartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
      const response = await fetch("/api/public/parts");
      const payload = await response.json();
      if (payload.success) {
        setData({
          content: payload.content,
          categories: payload.categories,
          parts: payload.parts,
          brands: payload.brands,
          benefits: payload.benefits,
        });
      }
      } catch (error) {
      console.error("Error loading parts data:", error);
      } finally {
      setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-geely-blue mb-4" />
          <p className="text-steel dark:text-steel-light">Loading parts...</p>
        </div>
      </MainLayout>
    );
  }

  const content = data?.content;
  const parts = data?.parts || [];
  const categories = data?.categories || [];
  const brands = data?.brands || [];
  const benefits = data?.benefits || [];

  // Category options: CMS categories + any category strings on parts
  const categoryOptions = Array.from(
    new Set([
      ...categories.map((c) => c.name),
      ...parts.map((p) => p.category).filter(Boolean),
    ])
  ).filter(Boolean);

  let filteredParts = parts;

  if (searchQuery) {
    const term = searchQuery.toLowerCase();
    filteredParts = filteredParts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term) ||
        (p.brand || "").toLowerCase().includes(term)
    );
  }

  if (selectedCategory !== "all") {
    filteredParts = filteredParts.filter((p) => p.category === selectedCategory);
  }

  if (selectedAvailability !== "all") {
    filteredParts = filteredParts.filter((p) => toAvailability(p) === selectedAvailability);
  }

  const addToCart = (partId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.partId === partId);
      if (existing) {
        return prev.map((c) => c.partId === partId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { partId, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (partId: string) => {
    setCart(cart.filter((c) => c.partId !== partId));
  };

  const updateQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(partId);
      return;
    }
    setCart(cart.map((c) => c.partId === partId ? { ...c, quantity } : c));
  };

  const clearCart = () => {
    setCart([]);
    setCartOpen(false);
  };

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartItems = cart
    .map((c) => {
      const part = parts.find((p) => p.id === c.partId);
      return part ? { cart: c, part } : null;
    })
    .filter((x): x is { cart: CartItem; part: Part } => x !== null);

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitting(true);
    setQuoteError("");
    try {
      const items = cartItems.map(({ part, cart }) => ({
        partId: part.id,
        partName: part.name,
        partSku: part.sku,
        unitPrice: part.price,
        quantity: cart.quantity,
      }));
      const response = await fetch("/api/public/parts/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quoteForm, items }),
      });
      const data = await response.json();
      if (data.success) {
        setQuoteSuccess(true);
        setCart([]);
        setQuoteForm({ name: "", company: "", phone: "", email: "", address: "", notes: "" });
      } else {
        setQuoteError(data.error || "Failed to submit request");
      }
    } catch (err) {
      setQuoteError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const heroBg =
    content?.heroBackgroundImage ||
    "bg-gradient-to-br from-[#0b1f3a] to-[#143a6d]";

  return (
    <MainLayout>
      {/* Hero */}
      <div className={`bg-navy text-white py-16 relative overflow-hidden`}>
        {content?.heroBackgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${content.heroBackgroundImage})` }}
          />
        )}
        {content?.heroBannerImage && (
          <div className="absolute right-10 top-1/2 hidden lg:block w-64 opacity-40 -translate-y-1/2">
            <img src={withBasePath(content.heroBannerImage)} alt="" className="w-full rounded-2xl shadow-2xl" />
          </div>
        )}
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            GENUINE GEELY PARTS
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            {content?.heroTitle || "Parts & Accessories"}
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            {content?.heroSubtitle ||
              "Find genuine Geely parts and accessories to keep your vehicle running at peak performance. All parts come with warranty and professional installation support."}
          </p>
        </div>
      </div>

      {/* Benefits Bar */}
      {benefits.length > 0 && (
        <div className="bg-ice dark:bg-midnight py-6 border-b border-line dark:border-midnight-line">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {benefits.map((benefit) => {
                const Icon = benefitIcons[benefit.icon || ""] || Shield;
                return (
                  <div key={benefit.id} className="flex items-center justify-center gap-3">
                    <Icon className="text-geely-blue" size={24} />
                    <div className="text-left">
                      <div className="font-bold text-navy dark:text-ice text-sm">{benefit.title}</div>
                      {benefit.description && (
                        <div className="text-xs text-steel dark:text-steel-light">{benefit.description}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Intro */}
      {content?.introHeading && (
        <section className="py-14">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center max-w-3xl">
            <h2 className="disp text-3xl font-bold text-navy dark:text-ice mb-4">{content.introHeading}</h2>
            <p className="text-steel dark:text-steel-light text-base leading-relaxed">{content.introDescription}</p>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="pb-14">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <h2 className="disp text-3xl font-bold text-navy dark:text-ice mb-6 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="group bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-lg p-4 text-center hover:shadow-lg transition-all"
                >
                  {cat.imageUrl ? (
                    <img src={withBasePath(cat.imageUrl)} alt={cat.name} className="w-full h-20 object-contain mb-2 rounded-md" />
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center bg-ice dark:bg-midnight rounded-md mb-2 text-xs text-steel dark:text-steel-light">
                      {cat.name}
                    </div>
                  )}
                  <div className="text-sm font-bold text-navy dark:text-ice group-hover:text-geely-blue">{cat.name}</div>
                  {cat.description && <div className="text-xs text-steel dark:text-steel-light mt-1 line-clamp-2">{cat.description}</div>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <section className="py-10 bg-ice dark:bg-midnight border-y border-line dark:border-midnight-line">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center text-[13px] tracking-[0.14em] text-steel dark:text-steel-light font-bold mb-6">
              COMPATIBLE WITH
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {brands.map((brand) =>
                brand.imageUrl ? (
                  <div key={brand.id} className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-2xl px-6 py-4 flex items-center justify-center min-w-32">
                    <img src={withBasePath(brand.imageUrl)} alt={brand.name} className="h-8 object-contain" />
                  </div>
                ) : (
                  <div key={brand.id} className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-2xl px-6 py-4 font-bold text-navy dark:text-ice min-w-32 text-center flex items-center justify-center">
                    {brand.name}
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Search & Filters */}
      <section className="py-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-steel dark:text-steel-light" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by part name, number, or vehicle..."
                  className="w-full pl-12 pr-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
              >
                <option value="all">All Availability</option>
                <option value="in-stock">In Stock</option>
                <option value="limited">Limited Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setSelectedAvailability("all"); }}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-line dark:border-midnight-line rounded-lg text-sm font-semibold text-steel dark:text-steel-light hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight transition-all"
            >
              <Filter size={18} /> Clear Filters
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-steel dark:text-steel-light">Showing {filteredParts.length} of {parts.length} parts</div>
            {cartCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="bg-geely-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all"
              >
                <ShoppingCart className="inline w-4 h-4 mr-1" /> Parts Request ({cartCount} items)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Parts Grid */}
      <section className="pb-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          {filteredParts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map((part, index) => {
                const availability = toAvailability(part);
                const badge = getAvailabilityBadge(availability);
                const isInCart = cart.some((c) => c.partId === part.id);
                const categoryName = part.category || (part.brand || "") || "General";

                return (
                  <motion.div key={part.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }} className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-lg overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative h-40 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-xs text-steel dark:text-steel-light text-center p-4 overflow-hidden">
                      {part.imageUrl ? (
                        <img src={withBasePath(part.imageUrl)} alt={part.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <span>{part.name}<br />Product Image</span>
                      )}
                      {part.isFeatured && (
                        <div className="absolute top-2 left-2 bg-gold text-[#2c2308] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> FEATURED
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 ${badge.color} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {badge.label}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-steel dark:text-steel-light mb-1">{categoryName}</div>
                      <h3 className="font-bold text-navy dark:text-ice mb-2 text-sm leading-tight">{part.name}</h3>
                      <div className="text-xs text-steel dark:text-steel-light mb-3">Part #: {part.sku}</div>
                      {part.brand && (
                        <div className="text-xs text-steel dark:text-steel-light mb-2"><span className="font-semibold text-navy dark:text-ice">Fit:</span> {part.brand}</div>
                      )}
                      <p className="text-xs text-steel dark:text-steel-light mb-3 leading-relaxed line-clamp-2">{part.description}</p>

                      <div className="border-t border-line dark:border-midnight-line pt-3">
                        <div className="flex gap-2">
                          {availability === "in-stock" || availability === "limited" ? (
                            <button onClick={() => isInCart ? removeFromCart(part.id) : addToCart(part.id)} className={`flex-1 text-xs font-bold py-2 px-3 rounded transition-all ${isInCart ? "bg-green-600 text-white" : "bg-geely-blue text-white hover:bg-opacity-90"}`}>
                              {isInCart ? "In Cart ✓" : "Add to Cart"}
                            </button>
                          ) : (
                            <button disabled className="flex-1 text-xs font-bold py-2 px-3 rounded bg-gray-400 text-white cursor-not-allowed">
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-navy dark:text-ice mb-3">No parts found</h3>
              <p className="text-steel dark:text-steel-light mb-6">Try adjusting your search terms or filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-midnight-surface shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-line dark:border-midnight-line bg-ice dark:bg-midnight">
              <h4 className="font-bold text-navy dark:text-ice">
                Parts Request ({cartCount} items)
              </h4>
              <button onClick={() => setCartOpen(false)} aria-label="Close parts request cart" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length > 0 ? (
                cartItems.map(({ part, cart }) => (
                  <div key={part.id} className="flex gap-3 border border-line dark:border-midnight-line rounded-lg p-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                      {part.imageUrl ? (
                        <img src={withBasePath(part.imageUrl)} alt={part.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-steel dark:text-steel-light text-center px-1">img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy dark:text-ice text-sm leading-tight">{part.name}</div>
                      <div className="text-xs text-steel dark:text-steel-light mb-1">Part #: {part.sku}</div>
                      <div className="flex items-center gap-1 mt-2">
                        <button onClick={() => updateQuantity(part.id, cart.quantity - 1)} className="w-7 h-7 flex items-center justify-center border border-line dark:border-midnight-line rounded hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={cart.quantity}
                          onChange={(e) => updateQuantity(part.id, Number(e.target.value))}
                          className="w-12 text-center rounded-md border border-line dark:border-midnight-line py-1 text-sm"
                        />
                        <button onClick={() => updateQuantity(part.id, cart.quantity + 1)} className="w-7 h-7 flex items-center justify-center border border-line dark:border-midnight-line rounded hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(part.id)} className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-steel dark:text-steel-light">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Your cart is empty</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-line dark:border-midnight-line space-y-3">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-navy dark:text-ice">Total Selected Items</span>
                  <span className="text-navy dark:text-ice">{cartCount}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 text-sm font-semibold py-3 px-4 border border-line dark:border-midnight-line rounded-lg hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight transition-all"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => setQuoteOpen(true)}
                    className="flex-1 text-sm font-bold py-3 px-4 bg-geely-blue text-white rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    Request Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {quoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setQuoteOpen(false); setQuoteSuccess(false); }} />
          <div className="relative w-full max-w-lg bg-white dark:bg-midnight-surface rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-line dark:border-midnight-line bg-ice dark:bg-midnight">
              <h4 className="font-bold text-navy dark:text-ice">Request Quote ({cartCount} items)</h4>
              <button onClick={() => { setQuoteOpen(false); setQuoteSuccess(false); }} aria-label="Close quote request" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {quoteSuccess ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-2">Request Submitted!</h3>
                <p className="text-steel dark:text-steel-light mb-6">
                  Thank you for your parts request. Our parts team will contact you shortly to confirm your quote.
                </p>
                <button
                  onClick={() => { setQuoteOpen(false); setQuoteSuccess(false); }}
                  className="bg-geely-blue text-white font-bold px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitQuote} className="flex-1 overflow-y-auto p-4 space-y-4">
                {quoteError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{quoteError}</div>
                )}

                {/* Selected parts summary */}
                <div className="bg-ice dark:bg-midnight border border-line dark:border-midnight-line rounded-lg p-3 text-xs text-steel dark:text-steel-light space-y-1">
                  {cartItems.map(({ part, cart }) => (
                    <div key={part.id} className="flex justify-between">
                      <span className="truncate pr-2">{part.name} × {cart.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-1">Name <span className="text-red-500">*</span></label>
                    <input required type="text" value={quoteForm.name} onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-1">Company</label>
                    <input type="text" value={quoteForm.company} onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                      className="w-full px-3 py-2 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Company (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-1">Phone <span className="text-red-500">*</span></label>
                    <input required type="tel" value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="+251 ..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-1">Email <span className="text-red-500">*</span></label>
                    <input required type="email" value={quoteForm.email} onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="you@email.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-1">Address</label>
                    <input type="text" value={quoteForm.address} onChange={(e) => setQuoteForm({ ...quoteForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Delivery or pickup address (optional)" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-1">Notes</label>
                    <textarea rows={3} value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Any additional information..." />
                  </div>
                </div>

                <button type="submit" disabled={quoteSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-geely-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {quoteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {quoteSubmitting ? 'Submitting...' : 'Submit Quote Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h3 className="disp text-3xl font-bold mb-4">
            {content?.ctaTitle || "Need Help Finding the Right Part?"}
          </h3>
          <p className="text-[#b9cbe4] text-base mb-8 max-w-2xl mx-auto">
            {content?.ctaDescription ||
              "Our parts specialists can help you identify the correct parts for your Geely vehicle and arrange professional installation."}
          </p>
          <a
            href={content?.ctaButtonLink || "tel:+251110000000"}
            className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
          >
            {content?.ctaButtonText || "Call Parts Department"}
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
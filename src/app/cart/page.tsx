"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CartAPI, OrdersAPI, Cart } from "@/lib/api";
import { useToast } from "@/components/toast";
import Spinner from "@/components/spinner";
import LocationPicker from "@/components/location-picker";
import { getBookCover } from "@/utils/bookCovers";

function CartItemSkeleton() {
  return (
    <div className="cart-item-skeleton">
      <div className="skeleton-line" style={{ width: 64, height: 64, borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton-line" style={{ width: "50%", height: 16, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: "25%", height: 14 }} />
      </div>
      <div className="skeleton-line" style={{ width: 80, height: 32, borderRadius: 8 }} />
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [shippingAddress, setShippingAddress] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoadingCart(true);
    try {
      const data = await CartAPI.getCart();
      setCart(data);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoadingCart(false);
    }
  }

  async function handleRemove(cartItemId: string) {
    if (removingId) return;
    setRemovingId(cartItemId);
    try {
      await CartAPI.removeFromCart(cartItemId);
      await loadCart();
      showToast("Item removed", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setRemovingId(null);
    }
  }

  async function handlePlaceOrder() {
    if (placing) return;
    if (!shippingAddress.trim()) {
      showToast("Please enter a shipping address", "error");
      return;
    }
    setPlacing(true);
    try {
      await OrdersAPI.placeOrder({
        shipping_address: shippingAddress,
        payment_method: "cod",
        notes: "",
      });
      showToast("Order placed!", "success");
      router.push("/orders");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setPlacing(false);
    }
  }

  if (loadingCart) {
    return (
      <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 20 }}>Your Cart</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => <CartItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, padding: 20 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
        <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>
          Looks like you haven't added any books yet.
        </p>
        <Link href="/books" className="btn-primary" style={{ display: "inline-flex" }}>
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 20 }}>Your Cart</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {cart.items.map((item) => {
          // ✅ Get cover image using utility
          const coverUrl = item.book ? getBookCover({
            id: item.book.id,
            title: item.book.title,
            category: item.book.category_id,
          }) : null;

          return (
            <div key={item.id} className="cart-item-card">
              {item.book?.cover_image_url ? (
                <img
                  src={item.book.cover_image_url}
                  alt={item.book.title}
                  className="cart-item-cover"
                  onError={(e) => {
                    // If image fails, use fallback
                    const target = e.target as HTMLImageElement;
                    if (coverUrl) target.src = coverUrl;
                  }}
                />
              ) : coverUrl ? (
                <img
                  src={coverUrl}
                  alt={item.book?.title || "Book"}
                  className="cart-item-cover"
                />
              ) : (
                <div className="cart-item-cover cart-item-cover-placeholder">📕</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="cart-item-title">
                  {item.book ? item.book.title : "Book unavailable"}
                </p>
                {item.book?.author && (
                  <p className="cart-item-author">{item.book.author}</p>
                )}
                <p className="cart-item-meta">
                  Qty: {item.quantity}
                  {item.book?.price !== undefined && (
                    <> · ₹{(item.book.price * item.quantity).toFixed(2)}</>
                  )}
                </p>
              </div>

              <button
                onClick={() => handleRemove(item.id)}
                disabled={removingId === item.id}
                className="btn-danger"
              >
                {removingId === item.id ? <Spinner /> : "Remove"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Shipping address</label>
        <input
          type="text"
          placeholder="Enter your full shipping address"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          className="search-input"
          style={{ marginBottom: 0 }}
        />
        <button
          type="button"
          onClick={() => setShowLocationPicker(true)}
          className="btn-secondary"
          style={{ alignSelf: "flex-start" }}
        >
          📍 Pick location on map
        </button>

        <div className="payment-coming-soon">
          <span style={{ fontSize: 18 }}>💳</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Online payments coming soon</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              For now, all orders are placed as Cash on Delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="panel cart-summary">
        <div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            {cart.total_items} item{cart.total_items !== 1 ? "s" : ""}
          </p>
          <strong style={{ fontSize: 20 }}>₹{cart.total_price}</strong>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="btn-primary"
          style={{ padding: "12px 28px" }}
        >
          {placing && <Spinner />}
          {placing ? "Placing order..." : "Place Order"}
        </button>
      </div>

      {showLocationPicker && (
        <LocationPicker
          onAddressSelect={(addr) => {
            setShippingAddress(addr);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
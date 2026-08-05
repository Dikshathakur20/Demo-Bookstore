"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrdersAPI, Order } from "@/lib/api";
import { useToast } from "@/components/toast";
import { getBookCover } from "@/utils/bookCovers";

// Skeleton Component
function OrderSkeleton() {
  return (
    <div className="order-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-line" style={{ width: "30%", height: 20 }} />
        <div className="skeleton-line" style={{ width: "15%", height: 20 }} />
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line" style={{ width: "60%", height: 16 }} />
        <div className="skeleton-line" style={{ width: "40%", height: 16 }} />
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-line" style={{ width: "20%", height: 14 }} />
        <div className="skeleton-line" style={{ width: "25%", height: 14 }} />
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
    confirmed: { label: "Confirmed", color: "#059669", bg: "#d1fae5" },
    processing: { label: "Processing", color: "#2563eb", bg: "#dbeafe" },
    shipped: { label: "Shipped", color: "#7c3aed", bg: "#ede9fe" },
    delivered: { label: "Delivered", color: "#16a34a", bg: "#dcfce7" },
    cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
  };

  const config = statusMap[status] || statusMap.pending;

  return (
    <span className="status-badge" style={{ 
      background: config.bg, 
      color: config.color 
    }}>
      {config.label}
    </span>
  );
}

// Format Date to Indian Format
function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Format Date with Time
function formatDateTime(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Custom Confirm Dialog Component
function ConfirmDialog({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onConfirm: () => void; 
  onCancel: () => void; 
  title: string; 
  message: string; 
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-btn confirm-btn-confirm" onClick={onConfirm}>
            Yes, Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    orderId: string | null;
  }>({
    isOpen: false,
    orderId: null,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setFetching(true);
    try {
      const response = await OrdersAPI.getOrders();
      console.log("📦 Orders API Response:", response);
      
      if (response && response.items) {
        setOrders(response.items);
      } else if (Array.isArray(response)) {
        setOrders(response);
      } else {
        console.log("⚠️ Unexpected response format:", response);
        setOrders([]);
      }
    } catch (err: any) {
      console.error("❌ Error loading orders:", err);
      showToast(err.message || "Failed to load orders", "error");
      setOrders([]);
    } finally {
      setFetching(false);
    }
  }

  // Open confirm dialog
  function openConfirmDialog(orderId: string) {
    setConfirmDialog({
      isOpen: true,
      orderId: orderId,
    });
  }

  // Close confirm dialog
  function closeConfirmDialog() {
    setConfirmDialog({
      isOpen: false,
      orderId: null,
    });
  }

  // Handle cancel order
  async function handleCancelOrder() {
    const orderId = confirmDialog.orderId;
    if (!orderId) return;

    closeConfirmDialog();
    setCancelling(orderId);
    
    try {
      await OrdersAPI.cancelOrder(orderId);
      showToast("Order cancelled successfully", "success");
      await loadOrders();
    } catch (err: any) {
      showToast(err.message || "Failed to cancel order", "error");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="orders-container">
      {/* Header */}
      <div className="orders-header">
        <h1 className="orders-title">My Orders</h1>
        <span className="orders-count">{orders.length} orders</span>
      </div>

      {/* Loading State */}
      {fetching && (
        <div className="orders-grid">
          {[...Array(3)].map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!fetching && orders.length === 0 && (
        <div className="orders-empty">
          <span className="empty-icon">📦</span>
          <h3>No Orders Yet</h3>
          <p>Start shopping to see your orders here</p>
          <Link href="/books" className="btn-shop-now">
            Browse Books →
          </Link>
        </div>
      )}

      {/* Orders List */}
      {!fetching && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              {/* Order Header */}
              <div className="order-header">
                <div className="order-header-left">
                  <span className="order-id">Order #{order.id?.slice(0, 8) || order.id}</span>
                  <span className="order-date">
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Order Items */}
              <div className="order-items">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => {
                    // ✅ Get cover image using utility
                    const coverUrl = item.book ? getBookCover({
                      id: item.book.id,
                      title: item.book.title,
                      category: item.book.category_id,
                    }) : null;

                    return (
                      <div key={item.id} className="order-item">
                        <div className="item-image">
                          {item.book?.cover_image_url ? (
                            <img 
                              src={item.book.cover_image_url} 
                              alt={item.book_name || "Book"}
                              className="item-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (coverUrl) target.src = coverUrl;
                              }}
                            />
                          ) : coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={item.book_name || "Book"}
                              className="item-cover"
                            />
                          ) : (
                            <div className="item-placeholder">📖</div>
                          )}
                        </div>
                        <div className="item-details">
                          <h4 className="item-title">{item.book_name || "Unknown Book"}</h4>
                          <p className="item-author">{item.book?.author || "Unknown Author"}</p>
                          <div className="item-meta">
                            <span className="item-qty">Qty: {item.quantity}</span>
                            <span className="item-price">₹{item.price_at_time?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="order-empty-items">
                    <p>No items in this order</p>
                  </div>
                )}
              </div>

              {/* Order Footer */}
              <div className="order-footer">
                <div className="order-footer-left">
                  <div className="order-total">
                    <span className="total-label">Total:</span>
                    <span className="total-amount">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
                  </div>
                  {order.estimated_delivery && (
                    <div className="order-delivery">
                      <span className="delivery-icon">🚚</span>
                      <span className="delivery-label">
                        Estimated Delivery: {formatDate(order.estimated_delivery)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="order-footer-right">
                  {order.status !== "cancelled" && order.status !== "delivered" && (
                    <button
                      onClick={() => openConfirmDialog(order.id)}
                      className="btn-cancel"
                      disabled={cancelling === order.id}
                    >
                      {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                  {order.status === "cancelled" && (
                    <span className="cancelled-label">Cancelled</span>
                  )}
                  {order.status === "delivered" && (
                    <span className="delivered-label">✓ Delivered</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onConfirm={handleCancelOrder}
        onCancel={closeConfirmDialog}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
      />
    </div>
  );
}
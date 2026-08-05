// ==============================
// API CLIENT
// Change this to your deployed backend URL
// ==============================
const API_BASE_URL = "https://bookstore-api-qkwp.vercel.app/api/v1";

const TOKEN_KEY = "bookstore_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

// Unwraps a paginated response ({ items: [...] }) or a raw array,
// so callers always get a plain array back regardless of backend shape.
function extractItems<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

// ---------- Types (matching actual backend schemas) ----------
export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type Book = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  category_id?: string;
  cover_image_url?: string;
  rating_avg?: number;
  rating_count?: number;
  category?: Category;
  created_at?: string;
  updated_at?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type CartItem = {
  id: string;
  book_id: string;
  quantity: number;
  added_at?: string;
  book: Book;
};

export type Cart = {
  items: CartItem[];
  total_items: number;
  total_price: number;
};

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address?: string;
  payment_status?: string;
  payment_method?: string;
  payment_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items: any[];
};

export type PlaceOrderPayload = {
  shipping_address: string;
  payment_method: string;
  notes?: string;
};

// ---------- Auth ----------
export const AuthAPI = {
  register: (name: string, email: string, password: string) =>
    apiRequest<{ id: string }>("/auth/register", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    }),

  login: (email: string, password: string) =>
    apiRequest<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  getCurrentUser: () => apiRequest<User>("/users/me"),
};

// ---------- Books ----------
// ---------- Books ----------
// ---------- Books ----------
export type BooksQuery = {
  q?: string;
  categoryId?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
};

export type PaginatedBooks = {
  items: Book[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

export const BooksAPI = {
  getBooks: async (query?: BooksQuery): Promise<Book[]> => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.categoryId) params.set("category_id", query.categoryId);
    if (query?.author) params.set("author", query.author);
    if (query?.minPrice !== undefined) params.set("min_price", String(query.minPrice));
    if (query?.maxPrice !== undefined) params.set("max_price", String(query.maxPrice));
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();

    const res = await apiRequest<any>(`/books/${qs ? `?${qs}` : ""}`);
    return extractItems<Book>(res);
  },
  getBook: (bookId: string) => apiRequest<Book>(`/books/${bookId}`),
};

// ---------- Categories ----------
export const CategoriesAPI = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiRequest<any>("/categories/", { auth: false });
    return extractItems<Category>(res);
  },
  getCategory: (categoryId: string) =>
    apiRequest<Category>(`/categories/${categoryId}`, { auth: false }),
};

// ---------- Cart ----------
// NOTE: add/update endpoints return a single CartItem, NOT the full cart.
// So after calling them, re-fetch the cart with getCart() to refresh totals.
export const CartAPI = {
  getCart: () => apiRequest<Cart>("/cart/"),

  addToCart: (bookId: string, quantity = 1) =>
    apiRequest<CartItem>("/cart/add", {
      method: "POST",
      body: { book_id: bookId, quantity },
    }),

  updateCartItem: (cartItemId: string, quantity: number) =>
    apiRequest<CartItem>(`/cart/${cartItemId}`, {
      method: "PUT",
      body: { quantity },
    }),

  removeFromCart: (cartItemId: string) =>
    apiRequest<unknown>(`/cart/${cartItemId}`, { method: "DELETE" }),

  clearCart: () => apiRequest<unknown>("/cart/clear", { method: "DELETE" }),
};

// ---------- Orders ----------
export const OrdersAPI = {
  placeOrder: (payload: PlaceOrderPayload) =>
    apiRequest<Order>("/orders/place", {
      method: "POST",
      body: payload,
    }),

  getOrders: async (): Promise<Order[]> => {
    const res = await apiRequest<any>("/orders/");
    return extractItems<Order>(res);
  },

  getOrder: (orderId: string) => apiRequest<Order>(`/orders/${orderId}`),

  // backend returns a plain string message on cancel
  cancelOrder: (orderId: string) =>
    apiRequest<string>(`/orders/${orderId}/cancel`, { method: "PUT" }),
};
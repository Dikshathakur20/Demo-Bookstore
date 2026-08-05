"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BooksAPI, CategoriesAPI, CartAPI, Book, Category } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import { getBookCover } from "@/utils/bookCovers";

function BookSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: "100%", height: 180, borderRadius: 12, marginBottom: 12 }} />
      <div className="skeleton-line" style={{ width: "70%", height: 16, marginBottom: 8 }} />
      <div className="skeleton-line" style={{ width: "45%", marginBottom: 8 }} />
      <div className="skeleton-line" style={{ width: "30%", height: 16 }} />
    </div>
  );
}

export default function BooksPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fetching, setFetching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    CategoriesAPI.getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    const timer = setTimeout(() => {
      loadBooks();
    }, 350);
    return () => clearTimeout(timer);
  }, [loading, user, search, categoryId]);

  async function loadBooks() {
    setFetching(true);
    try {
      const data = await BooksAPI.getBooks({
        q: search.trim() || undefined,
        categoryId: categoryId || undefined,
      });
      setBooks(data);
    } catch (err: any) {
      showToast(err.message, "error");
      setBooks([]);
    } finally {
      setFetching(false);
    }
  }

  function handleCategorySelect(id: string) {
    setCategoryId((prev) => (prev === id ? "" : id));
  }

  async function handleAddToCart(e: React.MouseEvent, bookId: string) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showToast("Please login to add books to cart", "error");
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (book && book.stock_quantity < 1) {
      showToast("Sorry, this book is out of stock", "error");
      return;
    }

    setAddingId(bookId);
    try {
      // ✅ CartAPI.addToCart expects { book_id, quantity }
      await CartAPI.addToCart(bookId, 1);
      showToast("✅ Added to cart!", "success");
      await loadBooks();
    } catch (err: any) {
      showToast(err.message || "Failed to add to cart", "error");
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <div className="books-grid" style={{ padding: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <BookSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-prompt-container">
        <div className="login-prompt-box">
          <span className="login-prompt-icon">🔒</span>
          <h2>Please Login to Browse Books</h2>
          <p>Login to explore our collection and start shopping</p>
          <Link href="/login" className="btn-primary">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="books-container">
      {/* Header */}
      <div className="books-header">
        <h1 className="books-title">📚 Browse Books</h1>
        <p className="books-subtitle">Discover your next favorite read</p>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search books by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="categories-wrapper">
        <button
          onClick={() => setCategoryId("")}
          className={`filter-chip ${categoryId === "" ? "active" : ""}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`filter-chip ${categoryId === cat.id ? "active" : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="results-count">
        <span>{books.length} books found</span>
      </div>

      {/* Books Grid */}
      <div className="books-grid">
        {fetching ? (
          Array.from({ length: 6 }).map((_, i) => (
            <BookSkeleton key={i} />
          ))
        ) : books.length > 0 ? (
          books.map((book) => {
            const coverUrl = getBookCover({
              id: book.id,
              title: book.title,
              category: book.category_id,
            });

            return (
              <div key={book.id} className="book-card-wrapper">
                <Link href={`/books/${book.id}`} className="book-card">
                  {/* Cover Image */}
                  <div className="book-cover-wrapper">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="book-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = coverUrl;
                        }}
                      />
                    ) : (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="book-cover"
                      />
                    )}
                    {book.stock_quantity < 1 && (
                      <div className="book-out-of-stock">Out of Stock</div>
                    )}
                    {book.rating_avg > 0 && (
                      <div className="book-rating">⭐ {book.rating_avg}</div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    <p className="book-price">₹{book.price}</p>
                  </div>
                </Link>

                {/* Add to Cart Button - Outside Link */}
                <div className="book-actions">
                  <button
                    onClick={(e) => handleAddToCart(e, book.id)}
                    disabled={
                      addingId === book.id || 
                      book.stock_quantity < 1
                    }
                    className={`add-to-cart-btn ${
                      book.stock_quantity < 1 ? "out-of-stock" : ""
                    }`}
                  >
                    {addingId === book.id ? (
                      <span className="btn-spinner">⏳</span>
                    ) : book.stock_quantity < 1 ? (
                      "Out of Stock"
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h3>No books found</h3>
            <p>Try adjusting your search or filter</p>
            <button
              onClick={() => {
                setSearch("");
                setCategoryId("");
              }}
              className="btn-clear-filters"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
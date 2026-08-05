"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CategoriesAPI, Category } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

function CategorySkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: "50%", height: 18, marginBottom: 10 }} />
      <div className="skeleton-line" style={{ width: "80%" }} />
    </div>
  );
}

const CATEGORY_GRADIENTS = [
  ["#2563eb", "#7c3aed"],
  ["#7c3aed", "#db2777"],
  ["#059669", "#0d9488"],
  ["#d97706", "#ea580c"],
  ["#dc2626", "#b91c1c"],
  ["#2563eb", "#0891b2"],
  ["#4f46e5", "#7c3aed"],
  ["#0d9488", "#2563eb"],
];

const CATEGORY_ICONS = ["📚", "🎭", "🔬", "💼", "❤️", "🧠", "🎨", "🚀"];

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Fiction", description: "Imaginative stories that transport you" },
  { id: "2", name: "Non-Fiction", description: "Real-world knowledge & insights" },
  { id: "3", name: "Science Fiction", description: "Futuristic tales & adventures" },
  { id: "4", name: "Business", description: "Professional growth & success" },
  { id: "5", name: "Romance", description: "Heartwarming love stories" },
  { id: "6", name: "Self-Help", description: "Personal development & growth" },
  { id: "7", name: "Art & Design", description: "Creative expression & inspiration" },
  { id: "8", name: "Technology", description: "Digital world & innovation" },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoadingCategories(true);
    setError(null);
    try {
      const data = await CategoriesAPI.getCategories();
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch (err: any) {
      console.error("Error loading categories:", err);
      setError(err.message || "Failed to load categories");
      showToast(err.message || "Failed to load categories", "error");
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoadingCategories(false);
    }
  }

  return (
    <div className="home-container">
      {/* Hero Section - Light Professional */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">✦ Premium Collection</div>
            <h1 className="hero-title">
              Discover Books That<br />
              <span className="hero-highlight">Inspire & Transform</span>
            </h1>
            <p className="hero-description">
              Curated collection of thousands of books across every genre. 
              From timeless classics to modern masterpieces — find your next read.
            </p>
            
            {!user && !loading && (
              <div className="hero-actions">
                <Link href="/login" className="btn-primary">
                  Get Started →
                </Link>
              </div>
            )}
            
            {user && (
              <div className="hero-welcome">
                <span className="welcome-icon">👋</span>
                <span>Welcome back,</span>
                <strong>{user.email?.split('@')[0]}</strong>
                <Link href="/books" className="btn-browse">
                  Browse Library →
                </Link>
              </div>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Books</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Authors</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">4.8</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">Why Choose Us</span>
          <h2 className="section-title">Your Trusted <span className="highlight">Bookstore</span></h2>
          <p className="section-desc">Experience the joy of reading with our premium services</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📚</span>
            <h3>Extensive Collection</h3>
            <p>Carefully curated books across multiple genres</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔍</span>
            <h3>Smart Discovery</h3>
            <p>Find exactly what you love with intelligent search</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <h3>Secure Checkout</h3>
            <p>Safe and seamless shopping experience</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⭐</span>
            <h3>Verified Reviews</h3>
            <p>Real ratings from passionate readers</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="section-header">
          <div>
            <span className="section-tag">Categories</span>
            <h2 className="section-title">Browse by <span className="highlight">Genre</span></h2>
          </div>
          {user && (
            <Link href="/books" className="link-view-all">
              View All →
            </Link>
          )}
        </div>

        <div className="categories-grid">
          {loadingCategories ? (
            Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
          ) : categories && categories.length > 0 ? (
            categories.map((cat, i) => {
              const [from, to] = CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length];
              const icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
              return (
                <div
                  key={cat.id}
                  className="category-card"
                  style={{
                    background: `linear-gradient(135deg, ${from}, ${to})`,
                  }}
                >
                  <span className="category-icon">{icon}</span>
                  <h3 className="category-name">{cat.name}</h3>
                  <p className="category-desc">{cat.description}</p>
                  <span className="category-action">
                    {user ? 'Explore →' : '🔒 Locked'}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="empty-state">No categories available.</div>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!user && !loading && (
          <div className="cta-banner">
            <div className="cta-banner-content">
              <span className="cta-banner-icon">🔓</span>
              <div>
                <p className="cta-banner-title">Start Your Reading Journey</p>
                <p className="cta-banner-sub">Sign in to access our complete collection</p>
              </div>
            </div>
            <div className="cta-banner-actions">
              <Link href="/login" className="btn-banner-primary">
                Get Started →
              </Link>
            </div>
          </div>
        )}
        
        {user && (
          <div className="cta-banner logged-in">
            <div className="cta-banner-content">
              <span className="cta-banner-icon">🎉</span>
              <div>
                <p className="cta-banner-title">Ready to Explore?</p>
                <p className="cta-banner-sub">{categories.length} genres waiting for you</p>
              </div>
            </div>
            <Link href="/books" className="btn-banner-primary">
              Browse Collection →
            </Link>
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <div className="footer-cta-content">
          <h2>Join Our Community of Readers</h2>
          <p>Discover, collect, and share your love for books</p>
          {!user && !loading && (
            <Link href="/login" className="btn-cta">
              Get Started →
            </Link>
          )}
          {user && (
            <Link href="/books" className="btn-cta">
              Continue Shopping →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
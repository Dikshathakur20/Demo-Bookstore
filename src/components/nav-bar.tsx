"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        📚 Book Store
      </Link>

      {!loading && (
        <nav>
          {user ? (
            <>
              <span className="user-greeting">
                Hi, {user.name || user.email?.split('@')[0] || 'User'}
              </span>
              <Link 
                href="/books" 
                className={`nav-link ${isActive('/books') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/cart" 
                className={`nav-link ${isActive('/cart') ? 'active' : ''}`}
              >
                Cart
              </Link>
              <Link 
                href="/orders" 
                className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
              >
                My Orders
              </Link>
              <button onClick={handleLogout} className="nav-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link 
                href="/login?tab=register" 
                className="nav-register"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
// utils/bookCovers.ts

export const getBookCover = (book: { id: string; title: string; category?: string }) => {
  // Try to get from category
  const categoryCovers: Record<string, string> = {
    'fiction': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'non-fiction': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d',
    'science-fiction': 'https://images.unsplash.com/photo-1532012197267-da84d127e765',
    'romance': 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
    'business': 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7',
    'self-help': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0',
    'technology': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
    'children': 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
  };

  // If book has category, use category cover
  if (book.category && categoryCovers[book.category]) {
    return `${categoryCovers[book.category]}?w=300&h=450&fit=crop&crop=center`;
  }

  // Fallback: use title as seed for random but consistent image
  return `https://picsum.photos/seed/${book.id}/300/450`;
};
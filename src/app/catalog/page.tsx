'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  size: string[] | null;
  colors: string[] | null;
  stock: number;
  rating?: number;
  images: { url: string; alt?: string }[];
  seller: {
    name: string;
  };
}

// Types for our filters
interface Filters {
  search: string;
  categories: string[];
  sizes: string[];
  priceRange: [number, number];
  sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest';
}

// Common sizes for filtering
const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '40', '42', '44', '46', '48', '50'];

// Default filter values
const DEFAULT_FILTERS: Filters = {
  search: '',
  categories: [],
  sizes: [],
  priceRange: [0, 100000],
  sortBy: 'newest',
};

// Extract unique categories from products
const getUniqueCategories = (products: Product[]): string[] => {
  const categories = new Set<string>();
  products.forEach(product => {
    categories.add(product.category);
  });
  return Array.from(categories).sort();
};

export default function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [isSizesOpen, setIsSizesOpen] = useState(true);
  
  // Get unique sizes from products
  const extractSizes = (products: Product[]): string[] => {
    const sizes = new Set<string>();
    
    products.forEach(product => {
      if (product.size && Array.isArray(product.size)) {
        product.size.forEach(size => sizes.add(size));
      } else if (product.size && typeof product.size === 'string') {
        sizes.add(product.size);
      }
    });
    
    return Array.from(sizes).sort((a, b) => {
      // Try to sort numerically first
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      // Fall back to string comparison
      return a.localeCompare(b);
    });
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build query params
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        filters.categories.forEach(cat => params.append('category', cat));
        if (filters.sizes.length > 0) {
          params.set('size', filters.sizes[0]); // For now, we'll use the first selected size
        }
        
        const response = await fetch(`/api/products?${params.toString()}`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Не удалось загрузить товары');
        }
        
        const data = await response.json();
        
        if (!data || typeof data !== 'object' || !Array.isArray(data.products)) {
          console.error('Неожиданный формат данных API:', data);
          throw new Error('Получены некорректные данные о товарах');
        }

        setProducts(data.products);
        
        // Update available categories and sizes
        if (data.products.length > 0) {
          setAvailableCategories(getUniqueCategories(data.products));
          
          const sizes = extractSizes(data.products);
          setAvailableSizes(sizes.length > 0 ? sizes : COMMON_SIZES);
          
          // Calculate price range from products
          const prices = data.products.map((p: Product) => p.price);
          const minPrice = Math.floor(Math.min(...prices) / 1000) * 1000;
          const maxPrice = Math.ceil(Math.max(...prices) / 1000) * 1000;
          setPriceRange([minPrice, maxPrice]);
          setFilters(prev => ({
            ...prev,
            priceRange: [minPrice, maxPrice]
          }));
        }
        
        // Extract categories
        const categories = getUniqueCategories(data.products);
        setAvailableCategories(categories);
        
      } catch (err) {
        console.error('Ошибка при получении товаров:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке каталога');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  // Apply filters when products or filters change
  useEffect(() => {
    if (products.length === 0) return;
    
    let result = [...products];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(product => 
        filters.categories.includes(product.category)
      );
    }
    
    // Apply price range filter
    result = result.filter(
      product => 
        product.price >= filters.priceRange[0] && 
        product.price <= filters.priceRange[1]
    );
    
    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
        default:
          // Assuming newer products have higher IDs (adjust based on your data)
          return b.id.localeCompare(a.id);
      }
    });
    
    setFilteredProducts(result);
  }, [products, filters]);
  
  // Update URL with current filters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] || 
        filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1]) {
      params.set('minPrice', filters.priceRange[0].toString());
      params.set('maxPrice', filters.priceRange[1].toString());
    }
    if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
      params.set('sort', filters.sortBy);
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);
  
  // Apply filters from URL on initial load
  useEffect(() => {
    if (products.length === 0) return;
    
    const params = new URLSearchParams(searchParams.toString());
    const newFilters = { ...DEFAULT_FILTERS };
    
    // Get search term
    const search = params.get('search');
    if (search) newFilters.search = search;
    
    // Get categories
    const categoriesParam = params.get('categories');
    if (categoriesParam) {
      newFilters.categories = categoriesParam.split(',').filter(Boolean);
    }
    
    // Get price range
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    if (minPrice && maxPrice) {
      newFilters.priceRange = [
        parseInt(minPrice, 10),
        parseInt(maxPrice, 10)
      ] as [number, number];
    }
    
    // Get sort option
    const sortBy = params.get('sort');
    if (sortBy && ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest'].includes(sortBy)) {
      newFilters.sortBy = sortBy as Filters['sortBy'];
    }
    
    setFilters(newFilters);
  }, [searchParams, products.length]);
  
  // Update URL when filters change
  useEffect(() => {
    updateUrlParams();
  }, [filters, updateUrlParams]);
  
  // Handle filter changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };
  
  const toggleCategory = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  }, []);
  
  const toggleSize = useCallback((size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [size] // For now, only allow one size at a time
    }));
  }, []);
  
  const handlePriceRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: value as [number, number]
    }));
  };
  
  const handleSortChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: value as Filters['sortBy']
    }));
  };
  
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };
  
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  // Loading skeleton
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Наши товары</h1>
          <div className="w-full md:w-64">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="w-full md:w-64 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-8 w-3/4 mt-8" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Products grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden shadow-sm">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}. <button onClick={() => window.location.reload()} className="font-medium underline hover:text-red-600">Попробовать снова</button>
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Основной контент
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Наши товары</h1>
        <div className="text-sm text-gray-500">
          Показано <span className="font-medium">{products.length}</span> товаров
        </div>
      </div>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <ProductCard
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                images={product.images && product.images.length > 0
                  ? product.images
                  : [{ url: '/placeholder-product.jpg', alt: 'Изображение отсутствует' }]
                }
                category={product.category}
                size={Array.isArray(product.size) ? product.size : product.size ? [product.size] : null}
                colors={Array.isArray(product.colors) ? product.colors : product.colors ? [product.colors] : null}
                stock={product.stock}
                rating={product.rating || 0}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Товары не найдены</h3>
          <p className="mt-1 text-gray-500">Попробуйте изменить параметры поиска или фильтры.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 
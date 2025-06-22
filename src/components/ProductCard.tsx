'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductImageSlider } from './ProductImageSlider';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/contexts/CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; alt?: string }[];
  category: string;
  size?: string | string[] | null;
  colors?: string | string[] | null;
  stock: number;
  rating?: number;
  className?: string;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  images = [],
  category,
  size,
  colors,
  stock,
  rating = 0,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const { addToCart } = useCart();
  
  // Check if product has sizes
  const hasSizes = Array.isArray(size) ? size.length > 0 : Boolean(size);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If product has sizes but no size is selected, show size selector
    if (hasSizes && !selectedSize) {
      setShowSizeSelector(true);
      return;
    }
    
    try {
      addToCart({
        id: `${id}-${selectedSize || ''}`,
        productId: id,
        name,
        price,
        image: images[0]?.url || '/placeholder-product.jpg',
        quantity: 1,
        size: selectedSize,
        color: Array.isArray(colors) ? colors[0] : colors || undefined,
      });

      // Visual feedback
      const button = e.currentTarget as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Добавлено!';
      button.classList.add('bg-green-500');
      
      setTimeout(() => {
        if (button) {
          button.textContent = originalText;
          button.classList.remove('bg-green-500');
        }
      }, 1500);
      
      // Reset selected size after adding to cart
      setSelectedSize(undefined);
      setShowSizeSelector(false);
    } catch (error) {
      console.error('Ошибка при добавлении в корзину:', error);
      alert('Не удалось добавить товар в корзину');
    }
  }, [addToCart, hasSizes, selectedSize, id, name, price, images, colors]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlist(!isWishlist);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderRatingStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ));
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white hover:bg-blue-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        transition={{ duration: 0.3 }}
        className={cn('h-full flex flex-col', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-64 w-full overflow-hidden">
          <Link href={`/products/${id}`} className="block h-full">
            <ProductImageSlider images={images} />
          </Link>
          
          <div className="absolute top-3 left-3 z-10">
            {stock < 10 && stock > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Осталось мало!
              </span>
            )}
            {stock === 0 && (
              <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Нет в наличии
              </span>
            )}
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 px-3"
              >
                <div className="relative">
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100 transition-colors hover:text-primary"
                    aria-label="Добавить в корзину"
                    title="Добавить в корзину"
                  >
                    <ShoppingCart size={18} />
                  </button>
                </div>
                <button
                  onClick={toggleWishlist}
                  className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-colors ${
                    isWishlist 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={isWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                  title={isWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  <Heart 
                    size={18} 
                    className={isWishlist ? 'fill-current' : ''} 
                    strokeWidth={isWishlist ? 2 : 1.5}
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-900 line-clamp-2">{name}</h3>
              <p className="text-sm text-gray-500">{category}</p>
            </div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(price)}</div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="flex">
                {renderRatingStars(rating)}
              </div>
              <span className="text-xs text-gray-500 ml-1">({rating})</span>
            </div>
            <span className="text-xs text-gray-500">{stock} в наличии</span>
          </div>

          {showSizeSelector && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Выберите размер</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(size) ? (
                  size.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSize(s);
                        setShowSizeSelector(false);
                      }}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        selectedSize === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(size || undefined);
                      setShowSizeSelector(false);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {size}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {selectedSize && !showSizeSelector && (
              <div className="text-sm text-gray-600">
                Выбран размер: <span className="font-medium">{selectedSize}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(undefined);
                  }}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 text-xs"
                >
                  Изменить
                </button>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={stock === 0 || (hasSizes && !selectedSize)}
              className={cn(
                'w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                'transition-colors duration-200',
                stock === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : hasSizes && !selectedSize
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700',
                className
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {stock === 0 
                ? 'Нет в наличии' 
                : hasSizes && !selectedSize 
                  ? 'Выберите размер' 
                  : 'В корзину'}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {Array.isArray(colors) && colors.length > 0 && (
              <div className="flex items-center text-xs text-gray-600">
                <span className="mr-1">Цвета:</span>
                <div className="flex -space-x-2">
                  {colors.slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {colors.length > 3 && (
                    <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs">
                      +{colors.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

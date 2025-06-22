'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  size: string;
  color: string;
  stock: number;
  sellerId: string;
}

export default function ProductsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageFile: null as File | null,
    category: '',
    size: '',
    color: '',
    stock: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (!session) {
        throw new Error('Сессия не найдена. Пожалуйста, войдите заново.');
      }
      
      // Получаем токен из сессии
      const token = (session as any)?.accessToken || (session as any)?.token;
      if (!token) {
        throw new Error('Токен доступа не найден. Пожалуйста, войдите заново.');
      }
      
      const isAdmin = session.user && 'role' in session.user && session.user.role === 'ADMIN';
      const url = isAdmin ? '/api/admin/products' : '/api/seller/products';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Важно для передачи куки, если используется httpOnly
      });
      
      if (response.status === 401) {
        // Если получили 401, возможно, токен истек
        router.push('/auth/login?error=session-expired');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка при загрузке товаров: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, imageFile: e.target.files[0] });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageFile: null,
      category: product.category,
      size: product.size,
      color: product.color,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      imageFile: null,
      category: '',
      size: '',
      color: '',
      stock: '',
      imageUrl: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    
    if (!session) {
      setError('Сессия не найдена. Пожалуйста, войдите заново.');
      setUploading(false);
      return;
    }

    try {
      let imageUrl = formData.imageUrl;
      
      // Upload new image if provided
      if (formData.imageFile) {
        const imgData = new FormData();
        imgData.append('file', formData.imageFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken || ''}`
          },
          body: imgData,
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Ошибка загрузки изображения');
        }
        
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.url;
      }

      const productData = {
        ...formData,
        imageUrl,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken || ''}`
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка при сохранении товара');
      }

      resetForm();
      fetchProducts();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Удалить товар?')) return;
    
    if (!session) {
      setError('Сессия не найдена. Пожалуйста, войдите заново.');
      return;
    }

    try {
      // Delete the product
      const response = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка при удалении товара');
      }

      // Delete the image if it exists
      if (imageUrl) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken || ''}`
          },
          body: JSON.stringify({ url: imageUrl }),
        });
      }
      
      // Refresh the products list
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Управление товарами</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Добавить товар</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Название</label>
              <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Описание</label>
              <textarea required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Цена (₽)</label>
              <input type="number" required min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Изображение</label>
              <input type="file" accept="image/*" required onChange={handleImageChange} className="mt-1 block w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Категория</label>
              <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Размер</label>
              <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Цвет</label>
              <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">В наличии (шт)</label>
              <input type="number" required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={uploading} className="flex-1 bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition">
                {uploading ? 'Сохранение...' : editingId ? 'Обновить товар' : 'Добавить товар'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-4 bg-gray-200 text-gray-700 py-2 rounded-md font-semibold hover:bg-gray-300 transition"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Ваши товары</h2>
          <ul className="space-y-4">
            {products.map(product => (
              <li key={product.id} className="flex items-center gap-4 border p-4 rounded-md bg-white">
                <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900">{product.name}</div>
                  <div className="text-gray-700">{product.description}</div>
                  <div className="text-gray-700">Цена: {product.price} ₽</div>
                  <div className="text-gray-700">Категория: {product.category}</div>
                  <div className="text-gray-700">Размер: {product.size}</div>
                  <div className="text-gray-700">Цвет: {product.color}</div>
                  <div className="text-gray-700">В наличии: {product.stock}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id, product.imageUrl)} 
                    className="text-red-600 hover:text-red-800"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 
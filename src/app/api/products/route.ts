import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findProducts, createProduct } from '@/lib/repositories/product.repository';
import { findUserById } from '@/lib/repositories/user.repository';
import { query } from '@/lib/db';

// Helper function to generate a random rating between 3.5 and 5
const generateRandomRating = () => {
  return parseFloat((Math.random() * 1.5 + 3.5).toFixed(1));
};

// Helper to parse JSON fields with fallback
const tryParseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    return fallback;
  }
};

// Отключаем статическую генерацию для этого роута
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const size = searchParams.get('size');
    const limit = parseInt(searchParams.get('limit') || '0');

    // Build SQL query conditions
    let queryStr = 'SELECT * FROM "Product" WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (category) {
      queryStr += ` AND "category" = $${paramIndex++}`;
      params.push(category);
    }

    if (search) {
      queryStr += ` AND ("name" ILIKE $${paramIndex} OR "description" ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (size) {
      queryStr += ` AND (
        "specifications"->>'size' = $${paramIndex} OR
        "specifications"->'sizes' @> $${paramIndex}::jsonb OR
        "size" = $${paramIndex}::text
      )`;
      params.push(`"${size}"`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${queryStr}) as subquery`;
    const totalResult = await query(countQuery, params);
    const total = parseInt(totalResult.rows[0].total, 10);

    // Add ordering and limit
    queryStr += ' ORDER BY "created_at" DESC';
    if (limit > 0) {
      queryStr += ` LIMIT $${paramIndex}`;
      params.push(limit);
    }

    // Get products
    const result = await query(queryStr, params);
    const products = result.rows;

    // Transform products
    const transformedProducts = await Promise.all(products.map(async (product: any) => {
      // Get seller info
      const seller = await findUserById(product.sellerId);
      
      // Get product images (assuming we have an images table)
      // TODO: Implement image repository
      const images = [];
      if (product.image) {
        images.push({
          id: product.id,
          url: product.image,
          alt: product.name,
        });
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        rating: generateRandomRating(),
        reviewCount: Math.floor(Math.random() * 100) + 1, // Random review count for demo
        seller: {
          id: seller?.id || '',
          name: seller?.name || 'Unknown Seller',
        },
        images,
        image: product.image || '/placeholder-product.jpg',
        specifications: tryParseJson<Record<string, string>>(
          product.specifications,
          {}
        ),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    }));

    return NextResponse.json({
      products: transformedProducts,
      total,
      limit: limit > 0 ? limit : undefined,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить продукты' },
      { status: 500 }
    );
  }
}

interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  specifications?: Record<string, any>;
  images?: File[];
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Verify user exists and has seller role
    const user = await findUserById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания товара' },
        { status: 403 }
      );
    }

    let productData: CreateProductRequest;
    let images: File[] = [];
    
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Get product data from form data
      productData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string || '0'),
        category: formData.get('category') as string,
        stock: parseInt(formData.get('stock') as string || '0'),
      };
      
      // Handle specifications if provided
      const specs = formData.get('specifications');
      if (specs) {
        try {
          productData.specifications = JSON.parse(specs as string);
        } catch (e) {
          console.warn('Failed to parse specifications:', e);
          productData.specifications = {};
        }
      }
      
      // Handle images
      const imageFiles = formData.getAll('images') as File[];
      if (imageFiles && imageFiles.length > 0) {
        images = imageFiles;
      }
    } else {
      // Handle JSON request
      productData = await request.json() as CreateProductRequest;
      if (productData.images) {
        images = productData.images;
      }
    }

    // Basic validation
    if (!productData.name || !productData.description || !productData.price || !productData.category) {
      return NextResponse.json(
        { error: 'Пожалуйста, заполните все обязательные поля' },
        { status: 400 }
      );
    }

    // Validate price and stock
    if (isNaN(productData.price) || productData.price <= 0) {
      return NextResponse.json(
        { error: 'Некорректная цена товара' },
        { status: 400 }
      );
    }

    if (isNaN(productData.stock) || productData.stock < 0) {
      return NextResponse.json(
        { error: 'Некорректное количество товара' },
        { status: 400 }
      );
    }

    // In a real app, you would upload the image to a storage service
    // For now, we'll just use a placeholder or the first image's name
    let imageUrl: string | undefined = undefined;
    if (images.length > 0) {
      // In a real app, you would upload the file here
      // For example: imageUrl = await uploadImage(images[0]);
      const image = images[0];
      const imageName = typeof image === 'string' ? image : image.name;
      imageUrl = `/uploads/${Date.now()}-${imageName}`;
    }

    // Create product
    const product = await createProduct({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      stock: productData.stock,
      specifications: productData.specifications || {},
      sellerId: user.id,
      image: imageUrl,
    });

    if (!product) {
      throw new Error('Не удалось создать товар');
    }

    // Add rating for display
    const productWithRating = {
      ...product,
      rating: generateRandomRating(),
      // Add additional fields that might be needed by the frontend
      seller: {
        id: user.id,
        name: user.name || 'Неизвестный продавец',
      },
      images: imageUrl ? [{ id: product.id, url: imageUrl, alt: product.name }] : [],
      reviewCount: 0, // No reviews yet
    };

    return NextResponse.json(productWithRating, { status: 201 });
  } catch (error) {
    console.error('Products create error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании товара' },
      { status: 500 }
    );
  }
}
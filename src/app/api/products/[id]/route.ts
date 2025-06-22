import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Update the type to correctly reflect the included relations and parsed fields
type ProductWithDetails = {
  id: string;
  name: string;
  price: number;
  sizes: string[]; // Expecting parsed JSON array
  colors: string[]; // Expecting parsed JSON array
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;

    // Replace this with your actual SQL query to fetch the product
    const product = {
      id: productId,
      name: 'Sample Product',
      price: 100,
      sizes: '["Small", "Medium", "Large"]',
      colors: '["Red", "Blue", "Green"]',
    };

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    // Parse JSON fields for sizes and colors and ensure correct type
    const productWithParsedFields: ProductWithDetails = {
      ...product,
      sizes: JSON.parse(product.sizes),
      colors: JSON.parse(product.colors),
    };

    return NextResponse.json(productWithParsedFields);
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных товара' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    const body = await request.json();
    
    const { name, description, price, category, size, color, stock, imageUrl } = body;

    // Validate required fields
    if (!name || !description || price === undefined || !category || !size || !color || stock === undefined) {
      return NextResponse.json(
        { error: 'Пожалуйста, заполните все обязательные поля' },
        { status: 400 }
      );
    }

    // Update the product in the database
    const result = await query(
      `UPDATE "Product" 
       SET name = $1, 
           description = $2, 
           price = $3, 
           category = $4, 
           size = $5, 
           color = $6, 
           stock = $7, 
           "imageUrl" = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, description, price, category, size, color, stock, imageUrl, productId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении товара' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    // Удаляем товар из базы данных
    await query('DELETE FROM "Product" WHERE id = $1', [productId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: 'Ошибка при удалении товара' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    const { id: userId } = verifyToken(token);

    const result = await query<{
      id: string;
      userId: string;
      productId: string;
      quantity: number;
      priceAtAddition: number;
      product_id: string;
      product_name: string;
      product_price: number;
      product_images: string;
    }>(
      `SELECT 
         ci.*,\n
         p.id as product_id,\n
         p.name as product_name,\n
         p.price as product_price,\n
         p.image as product_images
       FROM "CartItem" ci\n
       JOIN "Product" p ON ci."productId" = p.id\n
       WHERE ci."userId" = $1`, 
      [userId]
    );

    const items = result.rows.map(row => ({
       id: row.id,
       userId: row.userId,
       productId: row.productId,
       quantity: row.quantity,
       priceAtAddition: row.priceAtAddition,
       product: {
          id: row.product_id,
          name: row.product_name,
          price: row.product_price,
          images: row.product_images ? [{ url: row.product_images, alt: 'Product Image' }] : [],
       }
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Cart error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении корзины' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No or invalid Authorization header');
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token ? '[TOKEN_PRESENT]' : 'MISSING');

    const { id: userId } = verifyToken(token);
    const { productId, quantity, size, color } = await request.json();

    if (!productId || quantity === undefined || quantity <= 0) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const existingCartItemResult = await query<{
       id: string;
       quantity: number;
    }>(
       `SELECT id, quantity
        FROM "CartItem"
        WHERE "userId" = $1 AND "productId" = $2 AND size ${size ? '= $3' : 'IS NULL'} AND color ${color ? '= $4' : 'IS NULL'}`,
       [userId, productId].concat(size ? [size] : []).concat(color ? [color] : [])
    );
    const existingCartItem = existingCartItemResult.rows[0];

    if (existingCartItem) {
      await query(
        `UPDATE "CartItem"
         SET quantity = quantity + $1, updated_at = NOW()
         WHERE id = $2`,
        [quantity, existingCartItem.id]
      );
    } else {
      const productPriceResult = await query<{ price: number }>(
        `SELECT price FROM "Product" WHERE id = $1`,
        [productId]
      );
      const priceAtAddition = productPriceResult.rows[0]?.price || 0;

      await query(
        `INSERT INTO "CartItem" ("userId", "productId", quantity, size, color, "priceAtAddition", created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [userId, productId, quantity, size || null, color || null, priceAtAddition]
      );
    }

    return NextResponse.json({ message: 'Товар добавлен в корзину' });
  } catch (error) {
    console.error('Cart error:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении в корзину' },
      { status: 500 }
    );
  }
} 
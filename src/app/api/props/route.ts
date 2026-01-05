import { NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const andConditions = [];

  if (category) {
    andConditions.push({
      _or: [
        { category: { slug: { _eq: category } } },
        { category: { parent: { slug: { _eq: category } } } }
      ]
    });
  }

  if (search) {
    andConditions.push({
      _or: [
        { name: { _icontains: search } },
        { description: { _icontains: search } }
      ]
    });
  }

  try {
    const items = await directus.request(readItems('props', {
      fields: ['id', 'name', 'price', 'thumbnail', 'description', { category: ['name', 'slug'] }],
      filter: andConditions.length > 0 ? { _and: andConditions } : {},
      limit: 12,
      offset: offset,
      sort: ['-date_created']
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('API Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
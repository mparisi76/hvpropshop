import { NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Prop } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  // Using Record<string, unknown> avoids the 'any' linter error 
  // while still allowing the flexible structure Directus filters need.
  const andConditions: Record<string, unknown>[] = [
    { status: { _eq: 'published' } }
  ];

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
    // We type the request with <Prop[]> and remove 'as any' from fields.
    // If the linter complains about fields, we cast to 'const' to 
    // tell TS the array structure won't change.
    const items = await directus.request<Prop[]>(readItems('props', {
      fields: [
        'id', 
        'name', 
        'price', 
        'thumbnail', 
        'description', 
        'status',
        { category: ['id', 'name', 'slug', { parent: ['id', 'name', 'slug'] }] }
      ] as const, 
      filter: { _and: andConditions },
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
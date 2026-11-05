import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/services/business';

export async function GET(request: Request) {
  try {
    const { business } = await getCurrentUserProfile();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || !q.trim()) {
      return NextResponse.json({ success: false, error: 'Search query required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    let query = q.trim();

    // If query is a URL (e.g. http://.../card/[token]), extract the last path segment as the token
    if (query.includes('/card/')) {
      const parts = query.split('/card/');
      query = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    } else if (query.startsWith('http://') || query.startsWith('https://')) {
      const urlObj = new URL(query);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      query = segments[segments.length - 1] || query;
    }

    // 1. Direct match by qr_token
    const { data: tokenMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', business.id)
      .eq('qr_token', query)
      .single();

    if (tokenMatch) {
      return NextResponse.json({ success: true, customerId: tokenMatch.id });
    }

    // 2. Exact match by phone
    const { data: phoneMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', business.id)
      .eq('phone', query)
      .single();

    if (phoneMatch) {
      return NextResponse.json({ success: true, customerId: phoneMatch.id });
    }

    // 3. Match by name or partial phone
    const { data: searchMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', business.id)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(1)
      .single();

    if (searchMatch) {
      return NextResponse.json({ success: true, customerId: searchMatch.id });
    }

    return NextResponse.json(
      { success: false, error: `No customer found matching "${query}"` },
      { status: 404 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}

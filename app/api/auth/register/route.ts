import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, businessName } = await request.json();

    if (!email || !password || !businessName || !fullName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Check if user already exists or create with email_confirm: true
    let userId: string;
    const { data: existingUser } = await admin.auth.admin.listUsers();
    const found = existingUser?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (found) {
      // Auto-confirm and update password if needed
      await admin.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
      });
      userId = found.id;
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, business_name: businessName },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { success: false, error: createError?.message || 'Failed to create user.' },
          { status: 400 }
        );
      }
      userId = newUser.user.id;
    }

    // 2. Create Business if not already created
    const { data: existingProfile } = await admin
      .from('user_profiles')
      .select('business_id')
      .eq('id', userId)
      .single();

    if (!existingProfile?.business_id) {
      const { data: biz, error: bizError } = await admin
        .from('businesses')
        .insert({
          name: businessName.trim(),
          primary_color: '#18181b',
        })
        .select()
        .single();

      if (bizError || !biz) {
        return NextResponse.json(
          { success: false, error: bizError?.message || 'Failed to create business.' },
          { status: 400 }
        );
      }

      // Create profile
      await admin.from('user_profiles').upsert({
        id: userId,
        business_id: biz.id,
        full_name: fullName.trim(),
        role: 'owner',
      });

      // Create initial loyalty program
      await admin.from('loyalty_programs').insert({
        business_id: biz.id,
        name: 'Haircut Loyalty Rewards',
        stamps_required: 5,
        reward_title: 'Free Haircut',
        reward_description: 'Collect 5 haircuts and get one free haircut',
        is_active: true,
      });
    }

    // 3. Sign in on server to set session cookies
    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: signInError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Registration error' },
      { status: 500 }
    );
  }
}

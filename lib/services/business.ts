import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Business, LoyaltyProgram, UserProfile } from '@/types/database';

export async function getCurrentUserProfile(): Promise<{
  profile: UserProfile | null;
  business: Business | null;
  program: LoyaltyProgram | null;
  user: { id: string; email?: string } | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, business: null, program: null, user: null };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.business_id) {
    return { profile: profile || null, business: null, program: null, user: { id: user.id, email: user.email } };
  }

  // Get business details
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', profile.business_id)
    .single();

  // Get active loyalty program
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('business_id', profile.business_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    profile,
    business,
    program,
    user: { id: user.id, email: user.email },
  };
}

export async function setupBusinessOnboarding({
  businessName,
  fullName,
  stampsRequired = 5,
  rewardTitle = 'Free Haircut',
}: {
  businessName: string;
  fullName: string;
  stampsRequired?: number;
  rewardTitle?: string;
}): Promise<{ success: boolean; businessId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in first.' };
  }

  // Use admin client to perform atomic onboarding
  const admin = createAdminClient();

  // 1. Create Business
  const { data: business, error: bizError } = await admin
    .from('businesses')
    .insert({
      name: businessName.trim(),
      primary_color: '#18181b', // Default elegant slate/zinc
    })
    .select()
    .single();

  if (bizError || !business) {
    return { success: false, error: bizError?.message || 'Failed to create business' };
  }

  // 2. Create User Profile
  const { error: profileError } = await admin.from('user_profiles').upsert({
    id: user.id,
    business_id: business.id,
    full_name: fullName.trim(),
    role: 'owner',
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 3. Create Default Loyalty Program
  const { error: programError } = await admin.from('loyalty_programs').insert({
    business_id: business.id,
    name: 'Haircut Loyalty Rewards',
    stamps_required: stampsRequired,
    reward_title: rewardTitle,
    reward_description: `Collect ${stampsRequired} haircuts to unlock ${rewardTitle}`,
    is_active: true,
  });

  if (programError) {
    return { success: false, error: programError.message };
  }

  return { success: true, businessId: business.id };
}

export async function updateBusinessSettings({
  businessId,
  name,
  primaryColor,
  stampsRequired,
  rewardTitle,
}: {
  businessId: string;
  name: string;
  primaryColor?: string;
  stampsRequired: number;
  rewardTitle: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { error: bizError } = await supabase
    .from('businesses')
    .update({
      name: name.trim(),
      primary_color: primaryColor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessId);

  if (bizError) {
    return { success: false, error: bizError.message };
  }

  const { error: progError } = await supabase
    .from('loyalty_programs')
    .update({
      stamps_required: stampsRequired,
      reward_title: rewardTitle.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('business_id', businessId)
    .eq('is_active', true);

  if (progError) {
    return { success: false, error: progError.message };
  }

  return { success: true };
}

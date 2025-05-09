import { redirect } from 'next/navigation';
import React from 'react';
import { createClient } from '@/utils/supabase/server'; // Adjust path as needed
import FancyBackground from '@/components/FancyBackground';
import ComprehensiveApplicationForm from '@/app/onboarding/onboardingForm';
export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }
  return (
    <div className="min-h-screen mx-auto py-12 px-4 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 max-w-4xl mx-auto">Complete Your Profile</h1>
      <h4 className="text-xl text-gray-300 mb-3 max-w-4xl mx-auto">
  To help us automate as many job applications as possible, please complete this comprehensive form to the best of your knowledge and with accurate details.
</h4>

      <div className='max-w-4xl mx-auto'>
        <ComprehensiveApplicationForm/>
      </div>
      
    </div>
  );
}
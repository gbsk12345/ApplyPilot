// src/app/dashboard/profile/edit/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Define types for the data payload.
interface UserProfileDataForUpdate {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  authorized_to_work?: boolean | null;
  needs_sponsorship?: boolean | null;
  visa_status?: string | null;
  desired_salary?: string | null;
  willing_to_relocate?: boolean | null;
  interest_statement?: string | null;
  additional_info?: string | null;
  key_skills?: string | null;
  gender?: string | null;
  race?: string | null;
  veteran_status?: string | null;
  disability_status?: string | null;
}

interface EducationItemClient {
  id: number | string; // Critical: client sends number for existing, string for new
  school_name?: string | null;
  degree_level?: string | null;
  major?: string | null;
  start_date?: string | null;
  graduation_date?: string | null;
}

interface WorkExperienceItemClient {
  id: number | string; // Critical: client sends number for existing, string for new
  job_title?: string | null;
  company_name?: string | null;
  company_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  current_job?: boolean | null;
  job_description?: string | null;
}

export interface UpdateProfilePayload {
  userProfileData: Partial<UserProfileDataForUpdate>;
  educationUpdates: EducationItemClient[];
  workExperienceUpdates: WorkExperienceItemClient[];
  deletedEducationIds: number[]; // Numeric IDs of records to delete
  deletedWorkExperienceIds: number[]; // Numeric IDs of records to delete
}

const ensureValidDateOrNull = (dateString?: string | null): string | null => {
    if (!dateString) return null;
    // Matches YYYY-MM
    if (/^\d{4}-\d{2}$/.test(dateString)) {
        return `${dateString}-01`; // Append a default day
    }
    // Matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    // Attempt to parse other common date formats (optional, can be stricter)
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return null; // Invalid date
        return d.toISOString().split('T')[0]; // Format to YYYY-MM-DD
    } catch (e) {
        console.error('Error parsing date:', e);
        return null; // Error during parsing
    }
};

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<{ error?: string; success?: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'User not authenticated. Please log in again.' };
  }

  const {
    userProfileData,
    educationUpdates,
    workExperienceUpdates,
    deletedEducationIds,
    deletedWorkExperienceIds
  } = payload;

  // 1. Update user_profile table
  if (userProfileData && Object.keys(userProfileData).length > 0) {
    const { error: profileError } = await supabase
      .from('user_profile')
      .update(userProfileData)
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating user_profile:', profileError);
      return { error: `Failed to update profile: ${profileError.message}` };
    }
  }

  // 2. Handle Education records
  if (deletedEducationIds && deletedEducationIds.length > 0) {
    const { error: deleteEduError } = await supabase
      .from('education')
      .delete()
      .in('id', deletedEducationIds)
      .eq('user_id', user.id); // Ensure user can only delete their own records (RLS should also enforce this)
    if (deleteEduError) {
      console.error('Error deleting education records:', deleteEduError);
      return { error: `Failed to delete education records: ${deleteEduError.message}` };
    }
  }
  
  const educationToUpsert = educationUpdates
    .map(edu => ({
      id: typeof edu.id === 'number' ? edu.id : undefined, // Key for differentiating new vs. existing
      user_id: user.id,
      school_name: edu.school_name,
      degree_level: edu.degree_level,
      major: edu.major,
      start_date: ensureValidDateOrNull(edu.start_date),
      graduation_date: ensureValidDateOrNull(edu.graduation_date),
    }))
    .filter(edu => edu.school_name || edu.degree_level || edu.major); // Avoid saving empty records

  // For debugging RLS or other issues - kept as per your provided code
  console.log('Authenticated user.id for RLS check:', user.id);
  console.log('Education data being upserted:', JSON.stringify(educationToUpsert, null, 2));
  
  if (educationToUpsert.length > 0) {
      const { error: eduUpsertError } = await supabase
        .from('education')
        .upsert(educationToUpsert, { onConflict: 'id', defaultToNull: false });
      if (eduUpsertError) {
        console.error('Error upserting education:', eduUpsertError);
        return { error: `Failed to save education: ${eduUpsertError.message}` };
      }
  }

  // 3. Handle Work Experience records (apply the same logic as education)
  if (deletedWorkExperienceIds && deletedWorkExperienceIds.length > 0) {
     const { error: deleteWorkExpError } = await supabase
      .from('work_experience')
      .delete()
      .in('id', deletedWorkExperienceIds)
      .eq('user_id', user.id); // Ensure user can only delete their own records
    if (deleteWorkExpError) {
      console.error('Error deleting work experience records:', deleteWorkExpError);
      return { error: `Failed to delete work experience records: ${deleteWorkExpError.message}` };
    }
  }

  const workExperienceToUpsert = workExperienceUpdates
    .map(exp => ({
      id: typeof exp.id === 'number' ? exp.id : undefined, // Key for differentiating new vs. existing
      user_id: user.id,
      job_title: exp.job_title,
      company_name: exp.company_name,
      company_location: exp.company_location,
      start_date: ensureValidDateOrNull(exp.start_date),
      end_date: ensureValidDateOrNull(exp.end_date),
      current_job: exp.current_job,
      job_description: exp.job_description,
    }))
    .filter(exp => exp.job_title || exp.company_name); // Avoid saving empty records

  if (workExperienceToUpsert.length > 0) {
      const { error: workUpsertError } = await supabase
        .from('work_experience')
        .upsert(workExperienceToUpsert, { onConflict: 'id', defaultToNull: false });
      if (workUpsertError) {
        console.error('Error upserting work experience:', workUpsertError);
        return { error: `Failed to save work experience: ${workUpsertError.message}` };
      }
  }

  // Revalidate paths to reflect changes
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/profile/edit');
  revalidatePath('/dashboard/overview');
  
  if (userProfileData && (
        userProfileData.hasOwnProperty('first_name') || 
        userProfileData.hasOwnProperty('last_name') ||
        // userProfileData.hasOwnProperty('email') || // Email typically not updated here
        userProfileData.hasOwnProperty('avatar_url') 
     )) {
    revalidatePath('/dashboard', 'layout'); // Revalidate layout if name/avatar changes
  }

  return { success: true, message: 'Profile updated successfully!' };
}
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
  // email is typically not updated here as it's tied to auth and handled separately if needed
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
  willing_to_relocate?: boolean | null; // Note: your edit page <select> might send "true" as string
  interest_statement?: string | null;
  additional_info?: string | null;
  key_skills?: string | null;       // Added
  gender?: string | null;           // Added
  race?: string | null;             // Added
  veteran_status?: string | null;   // Added
  disability_status?: string | null;// Added
  // avatar_url?: string | null; // Add if you handle avatar uploads and want to update URL
}

interface EducationItemClient {
  id?: number | string; // Optional 'id' for new items, number for existing. `undefined` for new.
  school_name?: string | null;
  degree_level?: string | null;
  major?: string | null;
  start_date?: string | null;
  graduation_date?: string | null;
  // user_id will be set on the server
}

interface WorkExperienceItemClient {
  id?: number | string; // Optional 'id' for new items, number for existing. `undefined` for new.
  job_title?: string | null;
  company_name?: string | null;
  company_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  current_job?: boolean | null;
  job_description?: string | null;
  // user_id will be set on the server
}

export interface UpdateProfilePayload {
  userProfileData: Partial<UserProfileDataForUpdate>; // Client sends only changed fields
  educationUpdates: Array<Omit<EducationItemClient, 'user_id'>>; // Client sends array of items
  workExperienceUpdates: Array<Omit<WorkExperienceItemClient, 'user_id'>>; // Client sends array of items
  deletedEducationIds: number[];
  deletedWorkExperienceIds: number[];
}

const ensureValidDateOrNull = (dateString?: string | null): string | null => {
    if (!dateString || dateString.trim() === '') return null;
    // Matches YYYY-MM
    if (/^\d{4}-\d{2}$/.test(dateString)) {
        return `${dateString}-01`; // Append a default day
    }
    // Matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    try {
        const d = new Date(dateString); // Try to parse if it's a more complete date string
        if (isNaN(d.getTime())) return null; // Invalid date
        // Format to YYYY-MM-DD. Using UTC methods to avoid timezone shifts from toISOString().
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Error parsing date in ensureValidDateOrNull:', e);
        return null; 
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
  // Ensure only non-empty changed data is sent for update
  if (userProfileData && Object.keys(userProfileData).length > 0) {
    // Sanitize boolean-like fields if they come as strings from form
    const profileDataToUpdate = { ...userProfileData };
    if (typeof profileDataToUpdate.authorized_to_work === 'string') {
        profileDataToUpdate.authorized_to_work = profileDataToUpdate.authorized_to_work === 'true';
    }
    if (typeof profileDataToUpdate.needs_sponsorship === 'string') {
        profileDataToUpdate.needs_sponsorship = profileDataToUpdate.needs_sponsorship === 'true';
    }
    if (typeof profileDataToUpdate.willing_to_relocate === 'string') {
        profileDataToUpdate.willing_to_relocate = profileDataToUpdate.willing_to_relocate === 'true';
    }


    const { error: profileError } = await supabase
      .from('user_profile')
      .update(profileDataToUpdate) // Use sanitized data
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
      .eq('user_id', user.id);
    if (deleteEduError) {
      console.error('Error deleting education records:', deleteEduError);
      return { error: `Failed to delete education records: ${deleteEduError.message}` };
    }
  }
  
  // Prepare education data for upsert, ensuring user_id and correct date formats
  const educationToUpsert = educationUpdates
    .map(edu => ({
      ...edu, // Spread client-provided fields
      id: typeof edu.id === 'number' ? edu.id : undefined, // Handle ID for new vs existing
      user_id: user.id, // Ensure user_id is set on the server
      start_date: ensureValidDateOrNull(edu.start_date),
      graduation_date: ensureValidDateOrNull(edu.graduation_date),
    }))
    .filter(edu => edu.school_name || edu.degree_level || edu.major); // Avoid saving empty records


  // console.log('Authenticated user.id for RLS check:', user.id); // Kept for your debugging
  // console.log('Education data being upserted:', JSON.stringify(educationToUpsert, null, 2));
  
  if (educationToUpsert.length > 0) {
      const { error: eduUpsertError } = await supabase
        .from('education')
        .upsert(educationToUpsert, { onConflict: 'id', defaultToNull: false });
      if (eduUpsertError) {
        console.error('Error upserting education:', eduUpsertError);
        return { error: `Failed to save education: ${eduUpsertError.message}` };
      }
  }

  // 3. Handle Work Experience records
  if (deletedWorkExperienceIds && deletedWorkExperienceIds.length > 0) {
     const { error: deleteWorkExpError } = await supabase
      .from('work_experience')
      .delete()
      .in('id', deletedWorkExperienceIds)
      .eq('user_id', user.id);
    if (deleteWorkExpError) {
      console.error('Error deleting work experience records:', deleteWorkExpError);
      return { error: `Failed to delete work experience records: ${deleteWorkExpError.message}` };
    }
  }

  const workExperienceToUpsert = workExperienceUpdates
    .map(exp => ({
      ...exp, // Spread client-provided fields
      id: typeof exp.id === 'number' ? exp.id : undefined, // Handle ID for new vs existing
      user_id: user.id, // Ensure user_id is set on the server
      start_date: ensureValidDateOrNull(exp.start_date),
      end_date: ensureValidDateOrNull(exp.end_date),
      // current_job is already boolean from client, or should be
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
  revalidatePath('/dashboard/profile/edit'); // Revalidate edit page itself if it pre-fills from server data that might change
  revalidatePath('/dashboard/overview'); // Revalidate overview if it shows counts or related data
  
  // Check if any layout-relevant data (like name or avatar) was part of the update
  if (userProfileData && (
        userProfileData.hasOwnProperty('first_name') || 
        userProfileData.hasOwnProperty('last_name') ||
        userProfileData.hasOwnProperty('preferred_name') 
        // || userProfileData.hasOwnProperty('avatar_url') // Add if you have avatar_url
     )) {
    revalidatePath('/dashboard', 'layout'); // Revalidate the dashboard layout
  }

  return { success: true, message: 'Profile updated successfully!' };
}
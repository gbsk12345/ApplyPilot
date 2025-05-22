// src/app/dashboard/profile/edit/page.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
    CountrySelect,
    StateSelect,
    CitySelect,
} from 'react-country-state-city';
import Link from 'next/link';
import 'react-country-state-city/dist/react-country-state-city.css';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, type UpdateProfilePayload } from './actions'; 


// Define types (ideally from a shared types file)
export interface UserProfileData {
  user_id?: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
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
  // Add ALL editable fields from your user_profile table
  // These should match the keys in your user_profile table
  key_skills?: string | null; // Added from your comprehensive onboarding form
  gender?: string | null;
  race?: string | null;
  veteran_status?: string | null;
  disability_status?: string | null;
}

export interface EducationDataItem {
  id: number | string;
  school_name?: string | null;
  degree_level?: string | null;
  major?: string | null;
  start_date?: string | null; 
  graduation_date?: string | null;
}

export interface WorkExperienceDataItem {
  id: number | string;
  job_title?: string | null;
  company_name?: string | null;
  company_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  current_job?: boolean | null;
  job_description?: string | null;
}


export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<Partial<UserProfileData>>({});
  const [initialProfileSnapshot, setInitialProfileSnapshot] = useState<Partial<UserProfileData>>({});
  
  const [country, setCountry] = useState<any>(null);
  const [stateVal, setStateVal] = useState<any>(null);
  const [cityVal, setCityVal] = useState<any>(null);

  const [educations, setEducations] = useState<EducationDataItem[]>([]);
  const [initialEducationsSnapshot, setInitialEducationsSnapshot] = useState<EducationDataItem[]>([]);

  const [workExperiences, setWorkExperiences] = useState<WorkExperienceDataItem[]>([]);
  const [initialWorkExperiencesSnapshot, setInitialWorkExperiencesSnapshot] = useState<WorkExperienceDataItem[]>([]);
  
  const [deletedEducationIds, setDeletedEducationIds] = useState<number[]>([]);
  const [deletedWorkExperienceIds, setDeletedWorkExperienceIds] = useState<number[]>([]);

  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const storeInitialData = useCallback((profile: UserProfileData, edu: EducationDataItem[], work: WorkExperienceDataItem[]) => {
    const deepCopiedProfile = JSON.parse(JSON.stringify(profile));
    setInitialProfileSnapshot(deepCopiedProfile);
    setProfileData(deepCopiedProfile);

    const deepCopiedEdu = JSON.parse(JSON.stringify(edu));
    setInitialEducationsSnapshot(deepCopiedEdu);
    setEducations(deepCopiedEdu);

    const deepCopiedWork = JSON.parse(JSON.stringify(work));
    setInitialWorkExperiencesSnapshot(deepCopiedWork);
    setWorkExperiences(deepCopiedWork);

    if (profile.country) setCountry({ name: profile.country, id: profile.country }); // Assuming name and id are same if only name is stored for country
    else setCountry(null);
    if (profile.state) setStateVal({ name: profile.state, id: profile.state });
    else setStateVal(null);
    if (profile.city) setCityVal({ name: profile.city, id: profile.city });
    else setCityVal(null);

    setDeletedEducationIds([]);
    setDeletedWorkExperienceIds([]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingInitialData(true);
      setFormError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [profileRes, eduRes, workRes] = await Promise.all([
        supabase.from('user_profile').select('*').eq('user_id', user.id).single<UserProfileData>(),
        supabase.from('education').select('*').eq('user_id', user.id).order('graduation_date', { ascending: false }).returns<EducationDataItem[]>(),
        supabase.from('work_experience').select('*').eq('user_id', user.id).order('end_date', { ascending: false, nullsFirst: true }).order('start_date', { ascending: false }).returns<WorkExperienceDataItem[]>()
      ]);

      if (profileRes.data) {
        storeInitialData(profileRes.data, eduRes.data || [], workRes.data || []);
      } else if (profileRes.error && profileRes.error.code !== 'PGRST116') {
        setFormError(`Error loading profile: ${profileRes.error.message}`);
      } else {
         setFormError("Profile not found. Please complete onboarding first.");
         storeInitialData({} as UserProfileData, [], []);
      }

      if (eduRes.error) setFormError(prev => `${prev ? prev + '; ' : ''}Error loading education: ${eduRes.error.message}`);
      if (workRes.error) setFormError(prev => `${prev ? prev + '; ' : ''}Error loading work experience: ${workRes.error.message}`);
      
      setLoadingInitialData(false);
    };
    fetchData();
  }, [supabase, router, storeInitialData]);

  useEffect(() => {
    setProfileData(prev => ({ ...prev, country: country?.name || null }));
  }, [country]);
  useEffect(() => {
    setProfileData(prev => ({ ...prev, state: stateVal?.name || null }));
  }, [stateVal]);
  useEffect(() => {
    setProfileData(prev => ({ ...prev, city: cityVal?.name || null }));
  }, [cityVal]);

  const handleProfileInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfileData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'select-one' && (name === 'authorized_to_work' || name === 'needs_sponsorship' || name === 'willing_to_relocate')) {
      // Handle boolean-like selects
      setProfileData(prev => ({ ...prev, [name]: value === 'true' ? true : value === 'false' ? false : null }));
    }
    else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEducationChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* ... same as before ... */ 
    const { name, value } = e.target;
    const updated = [...educations];
    updated[index] = { ...updated[index], [name]: value };
    setEducations(updated);
  };
  const addEducation = () => { /* ... same as before ... */ 
    setEducations([...educations, { id: `new_${Date.now()}`, school_name: '', degree_level: '', major: '', graduation_date: '' }]);
  };
  const removeEducation = (index: number) => { /* ... same as before ... */ 
    const itemToRemove = educations[index];
    if (typeof itemToRemove.id === 'number') {
      setDeletedEducationIds(prev => [...prev, itemToRemove.id as number]);
    }
    setEducations(educations.filter((_, i) => i !== index));
  };

  const handleWorkExperienceChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { /* ... same as before ... */ 
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const updated = [...workExperiences];
    updated[index] = { ...updated[index], [name]: type === 'checkbox' ? checked : value };
    setWorkExperiences(updated);
  };
  const addWorkExperience = () => { /* ... same as before ... */ 
    setWorkExperiences([...workExperiences, { id: `new_${Date.now()}`, job_title: '', company_name: '', current_job: false }]);
  };
  const removeWorkExperience = (index: number) => { /* ... same as before ... */ 
    const itemToRemove = workExperiences[index];
    if (typeof itemToRemove.id === 'number') {
      setDeletedWorkExperienceIds(prev => [...prev, itemToRemove.id as number]);
    }
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };
  
  const formatDateForInput = (dateString?: string | null, type: 'month' | 'date' = 'month') => { /* ... same as before ... */ 
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; 
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      if (type === 'month') { return `${year}-${month}`; }
      const day = date.getUTCDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) { console.log(e);return ''; }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setFormError("User not authenticated. Please log in again.");
      setIsSubmitting(false);
      return;
  ``}
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const finalProfileDataFromState = {
        ...profileData,
        country: country?.name || profileData.country || null,
        state: stateVal?.name || profileData.state || null,
        city: cityVal?.name || profileData.city || null,
    };

    const changedProfileFields: Partial<UserProfileData> = {};
    let hasProfileChanges = false;
    for (const key in finalProfileDataFromState) {
      if (finalProfileDataFromState.hasOwnProperty(key)) {
        const typedKey = key as keyof UserProfileData;
        if (finalProfileDataFromState[typedKey] !== initialProfileSnapshot[typedKey]) {
          changedProfileFields[typedKey] = finalProfileDataFromState[typedKey];
          hasProfileChanges = true;
        }
      }
    }

    const hasEducationChanges = JSON.stringify(educations.map(({id, ...rest}) => ({...rest, id: typeof id === 'string' && id.startsWith('new_') ? undefined : id }))) !== JSON.stringify(initialEducationsSnapshot.map(({id, ...rest}) => ({...rest, id: typeof id === 'string' && id.startsWith('new_') ? undefined : id })));
    const hasWorkExperienceChanges = JSON.stringify(workExperiences.map(({id, ...rest}) => ({...rest, id: typeof id === 'string' && id.startsWith('new_') ? undefined : id }))) !== JSON.stringify(initialWorkExperiencesSnapshot.map(({id, ...rest}) => ({...rest, id: typeof id === 'string' && id.startsWith('new_') ? undefined : id })));


    if (!hasProfileChanges && !hasEducationChanges && !hasWorkExperienceChanges && deletedEducationIds.length === 0 && deletedWorkExperienceIds.length === 0) {
        setFormSuccess("No changes detected to save.");
        setIsSubmitting(false);
        return;
    }

    const payload: UpdateProfilePayload = {
      userProfileData: hasProfileChanges ? changedProfileFields : {},
      educationUpdates: educations,
      workExperienceUpdates: workExperiences,
      deletedEducationIds,
      deletedWorkExperienceIds,
    };

    try {
      const result = await updateUserProfile(payload);
      if (result.error) {
        setFormError(result.error);
      } else {
        setFormSuccess(result.message || 'Profile updated successfully!');

        if (user && user.id) {
          console.log(`Profile update successful. Invalidating localStorage cache for user: ${user.id}`);
          localStorage.removeItem(`userProfile-${user.id}`);
          localStorage.removeItem(`educationHistory-${user.id}`);
          localStorage.removeItem(`workExperiences-${user.id}`);
        } else {
          console.warn("User ID not available in handleSubmit after successful update. Cannot clear specific localStorage items.");
        }
        
         if (user) {
             const [profileRes, eduRes, workRes] = await Promise.all([
                supabase.from('user_profile').select('*').eq('user_id', user.id).single<UserProfileData>(),
                supabase.from('education').select('*').eq('user_id', user.id).order('graduation_date', { ascending: false }).returns<EducationDataItem[]>(),
                supabase.from('work_experience').select('*').eq('user_id', user.id).order('end_date', { ascending: true, nullsFirst: true }).order('start_date', { ascending: false }).returns<WorkExperienceDataItem[]>()
             ]);
             if(profileRes.data) storeInitialData(profileRes.data, eduRes.data || [], workRes.data || []);
         }
        router.refresh();
        router.push('/dashboard/profile');
      }
    } catch (err) {
      console.error("Client-side submission error:", err);
      setFormError('An unexpected error occurred on the client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/profile'); 
  };

  if (loadingInitialData) { /* ... same loading JSX ... */ 
    return <div className="p-6 text-center text-gray-300">Loading profile for editing...</div>;
  }
  if (formError && !profileData.first_name && !profileData.last_name && !loadingInitialData) { /* ... same error JSX ... */ 
      return (
        <div className="p-6 text-center">
          <p className="text-red-400">{formError}</p>
          <Link href="/dashboard/overview" className="mt-4 inline-block text-purple-400 hover:underline">
            Go to Dashboard Overview
          </Link>
        </div>
      );
  }

  const inputClass = "w-full p-2.5 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-purple-500 text-white";
  const selectClass = inputClass; // Can be styled differently if needed
  const labelClass = "block text-sm font-medium mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-10 p-4 md:p-6 bg-gray-800/70 rounded-lg shadow-xl text-gray-300">
      {formError && !formSuccess && <p className="mb-4 text-center text-red-400 bg-red-900/40 p-3 rounded-md border border-red-700">{formError}</p>}
      {formSuccess && <p className="mb-4 text-center text-green-400 bg-green-900/40 p-3 rounded-md border border-green-700">{formSuccess}</p>}

      {/* --- Personal Information Section --- */}
      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Personal Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div><label htmlFor="first_name" className={labelClass}>First Name</label><input type="text" name="first_name" id="first_name" value={profileData.first_name || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
            <div><label htmlFor="middle_name" className={labelClass}>Middle Name</label><input type="text" name="middle_name" id="middle_name" value={profileData.middle_name || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
            <div><label htmlFor="last_name" className={labelClass}>Last Name</label><input type="text" name="last_name" id="last_name" value={profileData.last_name || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
            <div><label htmlFor="preferred_name" className={labelClass}>Preferred Name</label><input type="text" name="preferred_name" id="preferred_name" value={profileData.preferred_name || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
            <div><label htmlFor="email_display" className={labelClass}>Email</label><input type="email" name="email_display" id="email_display" value={profileData.email || ''} className={`${inputClass} bg-gray-600 text-gray-400 cursor-not-allowed`} disabled readOnly title="Email cannot be changed here" /></div>
            <div><label htmlFor="phone" className={labelClass}>Phone</label><input type="tel" name="phone" id="phone" value={profileData.phone || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
        </div>
        <div className="mt-4"><label htmlFor="address_line1" className={labelClass}>Address Line 1</label><input type="text" name="address_line1" id="address_line1" value={profileData.address_line1 || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
        <div className="mt-4"><label htmlFor="address_line2" className={labelClass}>Address Line 2</label><input type="text" name="address_line2" id="address_line2" value={profileData.address_line2 || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="country-select">Country</label>
        <CountrySelect
          value={country}
          onChange={val => {
            setCountry(val);
            setStateVal(null);
            setCityVal(null);
          }}
          placeHolder={ country?.name || 'Select Country' }
          containerClassName="w-full"
          inputClassName="w-full"
        />
      </div>

      <div>
        <label htmlFor="state-select">State/Province</label>
        <StateSelect
          countryid={country?.isoCode}
          value={stateVal}
          onChange={val => {
            setStateVal(val);
            setCityVal(null);
          }}
          placeHolder={ stateVal?.name || 'Select State' }
          containerClassName="w-full"
          inputClassName="w-full"
        />
      </div>

      <div>
        <label htmlFor="city-select">City</label>
        <CitySelect
          countryid={country?.isoCode}
          stateid={stateVal?.isoCode}
          value={cityVal}
          onChange={val => setCityVal(val)}
          placeHolder={ cityVal?.name || 'Select City' }
          containerClassName="w-full"
          inputClassName="w-full"
        />
      </div>
    </div>
        <div className="mt-4"><label htmlFor="postal_code" className={labelClass}>Postal Code</label><input type="text" name="postal_code" id="postal_code" value={profileData.postal_code || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
      </fieldset>

      {/* --- Online Presence --- */}
      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Online Presence</legend>
        <div><label htmlFor="linkedin_url" className={labelClass}>LinkedIn Profile URL</label><input type="url" name="linkedin_url" id="linkedin_url" value={profileData.linkedin_url || ''} onChange={handleProfileInputChange} className={inputClass} placeholder="https://linkedin.com/in/yourprofile"/></div>
        <div><label htmlFor="website_url" className={labelClass}>Personal Website/Portfolio URL</label><input type="url" name="website_url" id="website_url" value={profileData.website_url || ''} onChange={handleProfileInputChange} className={inputClass} placeholder="https://yourwebsite.com"/></div>
        <div><label htmlFor="github_url" className={labelClass}>GitHub Profile URL</label><input type="url" name="github_url" id="github_url" value={profileData.github_url || ''} onChange={handleProfileInputChange} className={inputClass} placeholder="https://github.com/yourusername"/></div>
      </fieldset>

      {/* --- Work Authorization & Preferences --- */}
      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Work Authorization & Preferences</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                <label htmlFor="authorized_to_work" className={labelClass}>Legally authorized to work in the country of residence?</label>
                <select name="authorized_to_work" id="authorized_to_work" value={profileData.authorized_to_work === null || typeof profileData.authorized_to_work === 'undefined' ? '' : String(profileData.authorized_to_work)} onChange={handleProfileInputChange} className={selectClass}>
                    <option value="">Select...</option><option value="true">Yes</option><option value="false">No</option>
                </select>
            </div>
            <div>
                <label htmlFor="needs_sponsorship" className={labelClass}>Will you now or in the future require work visa sponsorship?</label>
                <select name="needs_sponsorship" id="needs_sponsorship" value={profileData.needs_sponsorship === null || typeof profileData.needs_sponsorship === 'undefined' ? '' : String(profileData.needs_sponsorship)} onChange={handleProfileInputChange} className={selectClass}>
                    <option value="">Select...</option><option value="true">Yes</option><option value="false">No</option>
                </select>
            </div>
            <div>
                <label htmlFor="visa_status" className={labelClass}>Current Visa Status (if applicable)</label>
                <input type="text" name="visa_status" id="visa_status" value={profileData.visa_status || ''} onChange={handleProfileInputChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="desired_salary" className={labelClass}>Desired Salary (e.g., 80000 USD per year)</label>
                <input type="text" name="desired_salary" id="desired_salary" value={profileData.desired_salary || ''} onChange={handleProfileInputChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="willing_to_relocate" className={labelClass}>Willing to relocate?</label>
                <select name="willing_to_relocate" id="willing_to_relocate" value={profileData.willing_to_relocate === null || typeof profileData.willing_to_relocate === 'undefined' ? '' : String(profileData.willing_to_relocate)} onChange={handleProfileInputChange} className={selectClass}>
                    <option value="">Select...</option><option value="true">Yes</option><option value="false">No</option><option value="maybe">Maybe</option> {/* Adjust if DB stores boolean or text */}
                </select>
            </div>
        </div>
      </fieldset>

      {/* --- Key Skills Section --- */}

      <fieldset className="space-y-4">
          <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Professional Skills</legend>
          <div>
              <label htmlFor="key_skills" className={labelClass}>Key Skills (comma-separated)</label>
              <textarea 
                name="key_skills" 
                id="key_skills" 
                rows={3} 
                value={profileData.key_skills || ''} 
                onChange={handleProfileInputChange} 
                className={inputClass}
                placeholder="e.g., Project Management, JavaScript, Public Speaking"
              />
          </div>
      </fieldset>

      {/* --- Work Experience Section --- */}
      <fieldset id="work-experience" className="space-y-4 scroll-mt-20">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Work Experience</legend>
        {workExperiences.map((exp, index) => (
          <div key={exp.id} className="p-4 border border-gray-700 rounded-lg space-y-3 bg-gray-700/40 relative">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-purple-300 mb-2">Experience #{index + 1}</h3>
                <button type="button" onClick={() => removeWorkExperience(index)} className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2.5 rounded-md shadow">Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div><label htmlFor={`exp_jobTitle_${index}`} className={labelClass}>Job Title</label><input type="text" name="job_title" id={`exp_jobTitle_${index}`} value={exp.job_title || ''} onChange={(e) => handleWorkExperienceChange(index, e)} className={inputClass} /></div>
                <div><label htmlFor={`exp_companyName_${index}`} className={labelClass}>Company Name</label><input type="text" name="company_name" id={`exp_companyName_${index}`} value={exp.company_name || ''} onChange={(e) => handleWorkExperienceChange(index, e)} className={inputClass} /></div>
            </div>
            <div><label htmlFor={`exp_companyLocation_${index}`} className={labelClass}>Location</label><input type="text" name="company_location" id={`exp_companyLocation_${index}`} value={exp.company_location || ''} onChange={(e) => handleWorkExperienceChange(index, e)} className={inputClass} /></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div><label htmlFor={`exp_startDate_${index}`} className={labelClass}>Start Date</label><input type="month" name="start_date" id={`exp_startDate_${index}`} value={formatDateForInput(exp.start_date, 'month')} onChange={e => handleWorkExperienceChange(index, e)} className={inputClass} /></div>
                <div><label htmlFor={`exp_endDate_${index}`} className={labelClass}>End Date</label><input type="month" name="end_date" id={`exp_endDate_${index}`} value={formatDateForInput(exp.end_date, 'month')} onChange={e => handleWorkExperienceChange(index, e)} disabled={!!exp.current_job} className={`${inputClass} disabled:opacity-60`} /></div>
            </div>
            <div className="flex items-center"><input type="checkbox" name="current_job" id={`exp_currentJob_${index}`} checked={!!exp.current_job} onChange={e => handleWorkExperienceChange(index, e)} className="h-4 w-4 text-purple-600 border-gray-600 rounded bg-gray-700 focus:ring-purple-500" /><label htmlFor={`exp_currentJob_${index}`} className="ml-2 block text-sm">I currently work here</label></div>
            <div><label htmlFor={`exp_jobDescription_${index}`} className={labelClass}>Description</label><textarea name="job_description" id={`exp_jobDescription_${index}`} rows={3} value={exp.job_description || ''} onChange={(e) => handleWorkExperienceChange(index, e)} className={inputClass} /></div>
          </div>
        ))}
        <button type="button" onClick={addWorkExperience} className="mt-4 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow">+ Add Work Experience</button>
      </fieldset>

      {/* --- Education Section --- */}
      <fieldset id="education" className="space-y-4 scroll-mt-20">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Education</legend>
        {educations.map((edu, index) => (
          <div key={edu.id} className="p-4 border border-gray-700 rounded-lg space-y-3 bg-gray-700/40 relative">
            <div className="flex justify-between items-start"><h3 className="text-lg font-medium text-purple-300 mb-2">Education #{index + 1}</h3><button type="button" onClick={() => removeEducation(index)} className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2.5 rounded-md shadow">Remove</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div><label htmlFor={`edu_schoolName_${index}`} className={labelClass}>School/University</label><input type="text" name="school_name" id={`edu_schoolName_${index}`} value={edu.school_name || ''} onChange={(e) => handleEducationChange(index, e)} className={inputClass} /></div>
                <div>
                    <label htmlFor={`edu_degreeLevel_${index}`} className={labelClass}>Degree Level</label>
                    {/* Example of a select for degree level */}
                    <select name="degree_level" id={`edu_degreeLevel_${index}`} value={edu.degree_level || ''} onChange={(e) => handleEducationChange(index, e)} className={selectClass}>
                    <option value="">Select Degree</option>
                                <option value="highschool">High School Diploma/GED</option>
                                <option value="associates">Associate&apos;s Degree</option>
                                <option value="bachelors">Bachelor&apos;s Degree</option>
                                <option value="masters">Master&apos;s Degree</option>
                                <option value="phd">Doctorate (PhD)</option>
                                <option value="professional">Professional Degree (MD, JD, etc.)</option>
                                <option value="other">Other</option>
                    </select>
                </div>
                <div><label htmlFor={`edu_major_${index}`} className={labelClass}>Major/Field of Study</label><input type="text" name="major" id={`edu_major_${index}`} value={edu.major || ''} onChange={(e) => handleEducationChange(index, e)} className={inputClass} /></div>
                <div><label htmlFor={`edu_graduationDate_${index}`} className={labelClass}>Graduation Date (or Expected)</label><input type="month" name="graduation_date" id={`edu_graduationDate_${index}`} value={formatDateForInput(edu.graduation_date, 'month')} onChange={(e) => handleEducationChange(index, e)} className={inputClass} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addEducation} className="mt-4 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow">+ Add Education</button>
      </fieldset>
      
      {/* --- Additional Information / Statements --- */}
      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Statements & Additional Info</legend>
        <div><label htmlFor="interest_statement" className={labelClass}>Interest Statement / Summary</label><textarea name="interest_statement" id="interest_statement" rows={4} value={profileData.interest_statement || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
        <div><label htmlFor="additional_info" className={labelClass}>Additional Information</label><textarea name="additional_info" id="additional_info" rows={4} value={profileData.additional_info || ''} onChange={handleProfileInputChange} className={inputClass} /></div>
      </fieldset>
      
      <fieldset id="voluntary-information" className="space-y-4 scroll-mt-20">
        <legend className="text-xl font-semibold text-white mb-6 border-b border-gray-600 pb-3">Voluntary Self-Identification</legend>
        <p className="text-sm text-gray-400 mb-4">
          Completion of this section is voluntary.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Gender */}
          <div>
            <label htmlFor="gender" className={labelClass}>Gender / Gender Identity</label>
            <select
              name="gender"
              id="gender"
              value={profileData.gender || ''}
              onChange={handleProfileInputChange}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other (please specify)</option>
              <option value="decline">I do not wish to identify</option>
            </select>
          </div>

          {/* Race/Ethnicity */}
          <div>
            <label htmlFor="race" className={labelClass}>Race / Ethnicity</label>
            <select
              name="race"
              id="race"
              value={profileData.race || ''}
              onChange={handleProfileInputChange}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              <option value="hispanic_latino">Hispanic or Latino</option>
              <option value="white">White (Not Hispanic or Latino)</option>
              <option value="black_african_american">Black or African American (Not Hispanic or Latino)</option>
              <option value="asian">Asian (Not Hispanic or Latino)</option>
              <option value="native_hawaiian_pacific_islander">Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)</option>
              <option value="american_indian_alaska_native">American Indian or Alaska Native (Not Hispanic or Latino)</option>
              <option value="two_or_more_races">Two or More Races (Not Hispanic or Latino)</option>
              <option value="decline">I do not wish to identify</option>
            </select>
          </div>

          {/* Veteran Status */}
          <div>
            <label htmlFor="veteran_status" className={labelClass}>Veteran Status</label>
            <select
              name="veteran_status"
              id="veteran_status"
              value={profileData.veteran_status || ''}
              onChange={handleProfileInputChange}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              <option value="not_veteran">I am not a protected veteran</option>
              <option value="protected_veteran">I identify as one or more of the classifications of protected veterans</option>
              <option value="decline">I do not wish to identify</option>
            </select>
          </div>

          {/* Disability Status */}
          <div>
            <label htmlFor="disability_status" className={labelClass}>Disability Status</label>
            <select
              name="disability_status"
              id="disability_status"
              value={profileData.disability_status || ''}
              onChange={handleProfileInputChange}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              <option value="yes_disability">Yes, I have a disability (or previously had one)</option>
              <option value="no_disability">No, I don&apos;t have a disability</option>
              <option value="decline">I do not wish to identify</option>
            </select>
          </div>
        </div>
      </fieldset>

      <div className="pt-8 mt-6 border-t border-gray-600 flex flex-col sm:flex-row justify-end gap-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition duration-150 order-2 sm:order-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || loadingInitialData}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition duration-150 order-1 sm:order-2"
        >
          {isSubmitting ? 'Saving Profile...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
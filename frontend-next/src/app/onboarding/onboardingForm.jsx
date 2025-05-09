'use client';
import React, { useState } from 'react';
import {
    CountrySelect,
    StateSelect,
    CitySelect,
  } from 'react-country-state-city';
  import 'react-country-state-city/dist/react-country-state-city.css';

  
export default function ComprehensiveApplicationForm() {
    // State for single fields (example, you'd add all others)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        preferredName: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        linkedinUrl: '',
        websiteUrl: '',
        githubUrl: '',
        resume: null,
        coverLetterFile: null,
        coverLetterText: '',
        // ... other single fields ...
        workEligibility: '',
        visaFuture: '',
        visaDetails: '',
        salaryExpectations: '',
        startDateAvailability: '',
        willingToRelocate: '',
        howHeard: '',
        referralName: '',
        sourceDetails: '',
        whyInterestedRole: '',
        additionalInfo: '',
        gender: '',
        genderOther: '',
        ethnicity: '',
        veteranStatus: '',
        disabilityStatus: '',

    });

    const [countryId, setCountryId] = useState(null)
    const [stateId, setStateId] = useState(null)


    // State for dynamic work experiences
    const [experiences, setExperiences] = useState([
        { jobTitle: '', companyName: '', companyLocation: '', startDate: '', endDate: '', currentJob: false, jobDescription: '' }
    ]);

    // State for dynamic education entries
    const [educations, setEducations] = useState([
        { schoolName: '', degreeLevel: '', major: '', graduationDate: '' }
    ]);

    // State for dynamic skills (example for language)
    const [languages, setLanguages] = useState([
        { language: '', proficiency: ''}
    ]);


    // --- Handlers for single form fields ---
    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
        }));
    };

    // --- Handlers for Work Experiences ---
    const handleExperienceChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const updatedExperiences = experiences.map((exp, i) =>
            i === index ? { ...exp, [name]: type === 'checkbox' ? checked : value } : exp
        );
        setExperiences(updatedExperiences);
    };

    const addExperience = () => {
        setExperiences([
            ...experiences,
            { jobTitle: '', companyName: '', companyLocation: '', startDate: '', endDate: '', currentJob: false, jobDescription: '' }
        ]);
    };

    const removeExperience = (index) => {
        if (experiences.length > 1) {
            const updatedExperiences = experiences.filter((_, i) => i !== index);
            setExperiences(updatedExperiences);
        }
    };

    // --- Handlers for Education ---
    const handleEducationChange = (index, e) => {
        const { name, value } = e.target;
        const updatedEducations = educations.map((edu, i) =>
            i === index ? { ...edu, [name]: value } : edu
        );
        setEducations(updatedEducations);
    };

    const addEducation = () => {
        setEducations([
            ...educations,
            { schoolName: '', degreeLevel: '', major: '', graduationDate: '' }
        ]);
    };

    const removeEducation = (index) => {
        if (educations.length > 1) {
            const updatedEducations = educations.filter((_, i) => i !== index);
            setEducations(updatedEducations);
        }
    };

    // --- Handlers for Languages ---
    const handleLanguageChange = (index, e) => {
        const { name, value } = e.target;
        const updatedLanguages = languages.map((lang, i) =>
            i === index ? { ...lang, [name]: value } : lang
        );
        setLanguages(updatedLanguages);
    };

    const addLanguage = () => {
        setLanguages([...languages, { language: '', proficiency: '' }]);
    };

    const removeLanguage = (index) => {
        if (languages.length > 0) { // Allow removing even if it's the last one, or adjust to languages.length > 1
            const updatedLanguages = languages.filter((_, i) => i !== index);
            setLanguages(updatedLanguages);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        // Consolidate all data
        const completeFormData = {
            ...formData,
            experiences,
            educations,
            languages,
        };
        console.log('Submitting Form Data:', completeFormData);
        // Here you would typically send completeFormData to your backend/API
    };
    
    // Conditional rendering for "Other Gender" input
    const [showOtherGenderInput, setShowOtherGenderInput] = useState(false);
    const handleGenderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
        if (name === "gender" && value === "other") {
            setShowOtherGenderInput(true);
        } else if (name === "gender") {
            setShowOtherGenderInput(false);
            setFormData(prevData => ({ ...prevData, genderOther: '' })); // Clear other gender field
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-white">
            {/* Personal Information */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Personal Information</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name*</label>
                        <input type="text" name="firstName" id="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="middleName" className="block text-sm font-medium mb-1">Middle Name/Initial</label>
                        <input type="text" name="middleName" id="middleName" value={formData.middleName} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name*</label>
                        <input type="text" name="lastName" id="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="preferredName" className="block text-sm font-medium mb-1">Preferred Name</label>
                        <input type="text" name="preferredName" id="preferredName" value={formData.preferredName} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address*</label>
                        <input type="email" name="email" id="email" required value={formData.email} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number*</label>
                        <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                </div>
                <div className="mt-4">
                    <label htmlFor="address1" className="block text-sm font-medium mb-1">Street Address Line 1*</label>
                    <input type="text" name="address1" id="address1" required value={formData.address1} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                </div>
                <div className="mt-4">
                    <label htmlFor="address2" className="block text-sm font-medium mb-1">Street Address Line 2</label>
                    <input type="text" name="address2" id="address2" value={formData.address2} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
  <div>
    <label htmlFor="country" className="block text-sm font-medium mb-1">Country*</label>
    <CountrySelect
      id="country"
      name="country"
      value={formData.country}
      onChange={(e) => {
        setFormData({ ...formData, country: e.name });
        setCountryId(e.id);
        setFormData({ ...formData, state: '', city: '' }); // Reset state and city when country changes
      }}
      placeHolder="Select Country"
      inputClassName="w-full p-2 rounded !bg-gray-800 text-white"
      containerClassName="w-full"
    />
  </div>
  <div>
    <label htmlFor="state" className="block text-sm font-medium mb-1">State/Province*</label>
    <StateSelect
      id="state"
      name="state"
      countryid={countryId}
      value={formData.state}
      onChange={(e) => {
        setFormData({ ...formData, state: e.name });
        setStateId(e.id);
        setFormData({ ...formData, city: '' }); // Reset city when state changes
      }}
      placeHolder="Select State"
      inputClassName="w-full p-2 rounded bg-gray-800 text-white"
      containerClassName="w-full"
    />
  </div>
  <div>
    <label htmlFor="city" className="block text-sm font-medium mb-1">City*</label>
    <CitySelect
      id="city"
      name="city"
      countryid={countryId}
      stateid={stateId}
      value={formData.city}
      onChange={(e) => setFormData({ ...formData, city: e.name })}
      placeHolder="Select City"
      inputClassName="w-full p-2 rounded bg-gray-800 text-white"
      containerClassName="w-full"
    />
  </div>
</div>
<div className="mt-4">
  <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Postal Code/Zip Code*</label>
  <input
    type="text"
    name="postalCode"
    id="postalCode"
    required
    value={formData.postalCode}
    onChange={handleInputChange}
    className="w-full p-2 rounded bg-gray-800 text-white"
  />
</div>
 
            </fieldset>

            {/* Professional Profile & Online Presence */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Online Presence</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="linkedinUrl" className="block text-sm font-medium mb-1">LinkedIn Profile URL</label>
                        <input type="url" name="linkedinUrl" id="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange} placeholder="https://linkedin.com/in/yourprofile" className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="websiteUrl" className="block text-sm font-medium mb-1">Personal Website/Portfolio URL</label>
                        <input type="url" name="websiteUrl" id="websiteUrl" value={formData.websiteUrl} onChange={handleInputChange} placeholder="https://yourwebsite.com" className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="githubUrl" className="block text-sm font-medium mb-1">GitHub Profile URL (if applicable)</label>
                        <input type="url" name="githubUrl" id="githubUrl" value={formData.githubUrl} onChange={handleInputChange} placeholder="https://github.com/yourusername" className="w-full p-2 rounded bg-gray-800" />
                    </div>
                </div>
            </fieldset>

            {/* Resume & Cover Letter */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Documents</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="resume" className="block text-sm font-medium mb-1">Upload Resume*</label>
                        <input type="file" name="resume" id="resume" accept=".pdf,.doc,.docx,.txt" required onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                    </div>
                    <div>
                        <label htmlFor="coverLetterFile" className="block text-sm font-medium mb-1">Upload Cover Letter</label>
                        <input type="file" name="coverLetterFile" id="coverLetterFile" accept=".pdf,.doc,.docx,.txt" onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                    </div>
                     <div>
                        <label htmlFor="coverLetterText" className="block text-sm font-medium mb-1">Or Paste Cover Letter Text</label>
                        <textarea name="coverLetterText" id="coverLetterText" rows={6} value={formData.coverLetterText} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800"></textarea>
                    </div>
                </div>
            </fieldset>

            {/* Work Experience */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Work Experience</legend>
                {experiences.map((exp, index) => (
                    <div key={index} className="space-y-4 border border-gray-700 p-4 rounded mb-4 mt-2 relative">
                         {experiences.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeExperience(index)}
                                className="absolute top-2 right-2 text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                            >
                                Remove
                            </button>
                        )}
                        <h3 className="text-lg font-medium">Experience #{index + 1}</h3>
                        <div>
                            <label htmlFor={`jobTitle-${index}`} className="block text-sm font-medium mb-1">Job Title</label>
                            <input type="text" name="jobTitle" id={`jobTitle-${index}`} value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor={`companyName-${index}`} className="block text-sm font-medium mb-1">Company Name</label>
                            <input type="text" name="companyName" id={`companyName-${index}`} value={exp.companyName} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor={`companyLocation-${index}`} className="block text-sm font-medium mb-1">Company Location (City, State)</label>
                            <input type="text" name="companyLocation" id={`companyLocation-${index}`} value={exp.companyLocation} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor={`startDate-${index}`} className="block text-sm font-medium mb-1">Start Date</label>
                                <input type="month" name="startDate" id={`startDate-${index}`} value={exp.startDate} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                            </div>
                            <div>
                                <label htmlFor={`endDate-${index}`} className="block text-sm font-medium mb-1">End Date</label>
                                <input type="month" name="endDate" id={`endDate-${index}`} value={exp.endDate} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-2 rounded bg-gray-800" disabled={exp.currentJob} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" name="currentJob" id={`currentJob-${index}`} checked={exp.currentJob} onChange={(e) => handleExperienceChange(index, e)} className="h-4 w-4 text-purple-600 border-gray-700 rounded bg-gray-800 focus:ring-purple-500" />
                            <label htmlFor={`currentJob-${index}`} className="ml-2 block text-sm">I currently work here</label>
                        </div>
                        <div>
                            <label htmlFor={`jobDescription-${index}`} className="block text-sm font-medium mb-1">Responsibilities & Achievements</label>
                            <textarea name="jobDescription" id={`jobDescription-${index}`} rows={4} value={exp.jobDescription} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-2 rounded bg-gray-800"></textarea>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addExperience}
                    className="mt-2 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded"
                >
                    Add Another Experience
                </button>
            </fieldset>

            {/* Education */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Education</legend>
                {educations.map((edu, index) => (
                    <div key={index} className="space-y-4 border border-gray-700 p-4 rounded mb-4 mt-2 relative">
                        {educations.length > 1 && (
                             <button
                                type="button"
                                onClick={() => removeEducation(index)}
                                className="absolute top-2 right-2 text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                            >
                                Remove
                            </button>
                        )}
                        <h3 className="text-lg font-medium">Education #{index + 1}</h3>
                        <div>
                            <label htmlFor={`schoolName-${index}`} className="block text-sm font-medium mb-1">School/University Name</label>
                            <input type="text" name="schoolName" id={`schoolName-${index}`} value={edu.schoolName} onChange={(e) => handleEducationChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor={`degreeLevel-${index}`} className="block text-sm font-medium mb-1">Degree Level</label>
                            <select name="degreeLevel" id={`degreeLevel-${index}`} value={edu.degreeLevel} onChange={(e) => handleEducationChange(index, e)} className="w-full p-2 rounded bg-gray-800">
                                <option value="">Select Degree</option>
                                <option value="highschool">High School Diploma/GED</option>
                                <option value="associates">Associate's Degree</option>
                                <option value="bachelors">Bachelor's Degree</option>
                                <option value="masters">Master's Degree</option>
                                <option value="phd">Doctorate (PhD)</option>
                                <option value="professional">Professional Degree (MD, JD, etc.)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`major-${index}`} className="block text-sm font-medium mb-1">Field of Study/Major</label>
                            <input type="text" name="major" id={`major-${index}`} value={edu.major} onChange={(e) => handleEducationChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor={`graduationDate-${index}`} className="block text-sm font-medium mb-1">Graduation Date (or Expected)</label>
                            <input type="month" name="graduationDate" id={`graduationDate-${index}`} value={edu.graduationDate} onChange={(e) => handleEducationChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addEducation}
                    className="mt-2 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded"
                >
                    Add Another Education
                </button>
            </fieldset>

             {/* Skills & Languages */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Skills & Languages</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="keySkills" className="block text-sm font-medium mb-1">Key Skills (comma-separated)</label>
                        <input type="text" name="keySkills" id="keySkills" value={formData.keySkills || ''} onChange={handleInputChange} placeholder="e.g., Project Management, JavaScript, Public Speaking" className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                         <h4 className="text-md font-medium mb-2">Language Proficiency</h4>
                        {languages.map((lang, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-end border-b border-gray-800 pb-3">
                                <div className="md:col-span-1">
                                    <label htmlFor={`language-${index}`} className="block text-sm font-medium mb-1">Language</label>
                                    <input type="text" name="language" id={`language-${index}`} value={lang.language} onChange={(e) => handleLanguageChange(index, e)} placeholder="e.g., Spanish" className="w-full p-2 rounded bg-gray-800" />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor={`languageProficiency-${index}`} className="block text-sm font-medium mb-1">Proficiency</label>
                                    <select name="proficiency" id={`languageProficiency-${index}`} value={lang.proficiency} onChange={(e) => handleLanguageChange(index, e)} className="w-full p-2 rounded bg-gray-800">
                                        <option value="">Select Proficiency</option>
                                        <option value="basic">Basic</option>
                                        <option value="conversational">Conversational</option>
                                        <option value="fluent">Fluent</option>
                                        <option value="native">Native/Bilingual</option>
                                    </select>
                                </div>
                                {languages.length > 0 && ( // Or languages.length > 1 if you don't want to remove the last one
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(index)}
                                        className="text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded h-10"
                                    >
                                        Remove Language
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addLanguage}
                            className="mt-2 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded"
                        >
                            Add Language
                        </button>
                    </div>
                </div>
            </fieldset>


            {/* Work Authorization (using existing state) */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Work Authorization</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="workEligibility" className="block text-sm font-medium mb-1">Are you legally authorized to work in the country for which you are applying?*</label>
                        <select name="workEligibility" id="workEligibility" required value={formData.workEligibility} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="visaFuture" className="block text-sm font-medium mb-1">Will you now or in the future require sponsorship for employment visa status (e.g., H-1B, etc.)?*</label>
                        <select name="visaFuture" id="visaFuture" required value={formData.visaFuture} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="visaDetails" className="block text-sm font-medium mb-1">If yes to requiring sponsorship, please specify current visa status or type needed (if known):</label>
                        <input type="text" name="visaDetails" id="visaDetails" value={formData.visaDetails} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                </div>
            </fieldset>

            {/* Job Preferences & Logistics */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Job Preferences</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="salaryExpectations" className="block text-sm font-medium mb-1">Desired Salary/Compensation Expectations (e.g., per year, optional)</label>
                        <input type="text" name="salaryExpectations" id="salaryExpectations" value={formData.salaryExpectations} onChange={handleInputChange} placeholder="e.g., $70,000 per year or 15 LPA" className="w-full p-2 rounded bg-gray-800" />
                    </div>
                    <div>
                        <label htmlFor="startDateAvailability" className="block text-sm font-medium mb-1">Earliest Start Date/Availability</label>
                        <input type="date" name="startDateAvailability" id="startDateAvailability" value={formData.startDateAvailability} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                     <div>
                        <label htmlFor="willingToRelocate" className="block text-sm font-medium mb-1">Are you willing to relocate?  (Answering No will result in filling no to all relocations)</label>
                        <select name="willingToRelocate" id="willingToRelocate" value={formData.willingToRelocate} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="maybe">Maybe (discuss details)</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* Referral & Source */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Referral & Source</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="howHeard" className="block text-sm font-medium mb-1">How did you hear about this job/company?</label>
                        <select name="howHeard" id="howHeard" value={formData.howHeard} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Select Source</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="company_website">Company Website</option>
                            <option value="employee_referral">Employee Referral</option>
                            <option value="job_board">Job Board (e.g., Indeed, Glassdoor)</option>
                            <option value="career_fair">Career Fair</option>
                            <option value="social_media">Social Media</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="referralName" className="block text-sm font-medium mb-1">If referred by an employee, their name/email:</label>
                        <input type="text" name="referralName" id="referralName" value={formData.referralName} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                     <div>
                        <label htmlFor="sourceDetails" className="block text-sm font-medium mb-1">If Job Board or Other, please specify:</label>
                        <input type="text" name="sourceDetails" id="sourceDetails" value={formData.sourceDetails} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800" />
                    </div>
                </div>
            </fieldset>
            
            {/* Additional Questions */}
            <fieldset className="border p-4 rounded">
                <legend className="text-xl font-semibold mb-2 px-1">Additional Information</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="whyInterestedRole" className="block text-sm font-medium mb-1">Why are you interested in this role?</label>
                        <textarea name="whyInterestedRole" id="whyInterestedRole" rows={3} value={formData.whyInterestedRole} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800"></textarea>
                    </div>
                     <div>
                        <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">Is there any additional information you would like to share?</label>
                        <textarea name="additionalInfo" id="additionalInfo" rows={3} value={formData.additionalInfo} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800"></textarea>
                    </div>
                </div>
            </fieldset>

            {/* Voluntary EEO/DEI Data */}
            <fieldset className="border p-4 rounded border-dashed border-gray-500">
                <legend className="text-xl font-semibold mb-2 px-1 text-gray-400">Voluntary Self-Identification</legend>
                <p className="text-sm text-gray-400 mb-4">
                    Completion of this section is voluntary and will not affect your opportunity for employment, or terms or conditions of employment. This information will be used for EEO reporting purposes and to support our diversity and inclusion efforts.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium mb-1">Gender / Gender Identity</label>
                        <select name="gender" id="gender" value={formData.gender} onChange={handleGenderChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="nonbinary">Non-binary</option>
                            <option value="other">Other (please specify)</option>
                            <option value="decline">I do not wish to identify</option>
                        </select>
                        {showOtherGenderInput && (
                             <input type="text" name="genderOther" id="genderOther" value={formData.genderOther} onChange={handleInputChange} placeholder="Specify if 'Other'" className="mt-1 w-full p-2 rounded bg-gray-800" />
                        )}
                    </div>
                    <div>
                        <label htmlFor="ethnicity" className="block text-sm font-medium mb-1">Race / Ethnicity</label>
                        <select name="ethnicity" id="ethnicity" value={formData.ethnicity} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
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
                    <div>
                        <label htmlFor="veteranStatus" className="block text-sm font-medium mb-1">Veteran Status</label>
                        <select name="veteranStatus" id="veteranStatus" value={formData.veteranStatus} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Prefer not to say</option>
                            <option value="not_veteran">I am not a protected veteran</option>
                            <option value="protected_veteran">I identify as one or more of the classifications of protected veterans</option>
                            <option value="decline">I do not wish to identify</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="disabilityStatus" className="block text-sm font-medium mb-1">Disability Status</label>
                        <select name="disabilityStatus" id="disabilityStatus" value={formData.disabilityStatus} onChange={handleInputChange} className="w-full p-2 rounded bg-gray-800">
                            <option value="">Prefer not to say</option>
                            <option value="yes_disability">Yes, I have a disability (or previously had one)</option>
                            <option value="no_disability">No, I don't have a disability</option>
                            <option value="decline">I do not wish to identify</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <button
                type="submit"
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 p-3 rounded font-bold text-lg"
            >
                Submit Application
            </button>
        </form>
    );
}
// src/app/dashboard/applications/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link'; // For "Add New" button if it links to a form page

interface Application {
  id: string; // or number
  job_title: string;
  company_name: string;
  application_date: string | null;
  status: string;
  // Add other fields from your 'applications' table
}

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let applications: Application[] = [];
  let fetchError: string | null = null;

  if (user) {
    const { data, error } = await supabase
      .from('Applications') // Replace 'applications' with your actual table name if different
      .select('id, job_title, company_name, application_date, status')
      .eq('user_id', user.id)
      .order('application_date', { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      fetchError = "Could not fetch applications. Please ensure the 'applications' table exists and is configured correctly.";
      // applications will remain empty
    } else {
      applications = data as Application[];
    }
  } else {
    fetchError = "User not found. Cannot fetch applications.";
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">My Job Applications</h1>
        <Link href="/dashboard/applications/new" // Assuming a page for adding new applications
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          + Add New Application
        </Link>
      </div>

      {fetchError && <p className="text-red-400 bg-red-900/30 p-3 rounded-md">{fetchError}</p>}
      
      {!fetchError && applications.length === 0 && (
        <div className="text-center py-10 bg-gray-700 rounded-lg shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-white">No applications tracked</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by adding your first job application.</p>
          <div className="mt-6">
            <Link href="/dashboard/applications/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
            >
              Add New Application
            </Link>
          </div>
        </div>
      )}

      {!fetchError && applications.length > 0 && (
        <div className="overflow-x-auto bg-gray-700 shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-200 uppercase bg-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3">Job Title</th>
                <th scope="col" className="px-6 py-3">Company</th>
                <th scope="col" className="px-6 py-3">Date Applied</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-600 hover:bg-gray-600/50">
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{app.job_title}</th>
                  <td className="px-6 py-4">{app.company_name}</td>
                  <td className="px-6 py-4">{formatDate(app.application_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      app.status === 'Applied' ? 'bg-blue-500 text-blue-100' :
                      app.status === 'Interviewing' ? 'bg-yellow-500 text-yellow-100' :
                      app.status === 'Offer' ? 'bg-green-500 text-green-100' : 
                      app.status === 'Rejected' ? 'bg-red-500 text-red-100' : 
                      app.status === 'Wishlist' ? 'bg-indigo-500 text-indigo-100' : 
                      'bg-gray-500 text-gray-100'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Replace with Link to an edit page: /dashboard/applications/edit/[id] */}
                    <a href="#" className="font-medium text-purple-400 hover:underline">View/Edit</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
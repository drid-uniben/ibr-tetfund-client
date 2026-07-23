"use client"
import { useState, useRef, useEffect, useCallback  } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import Header from '@/components/header';
import Link from 'next/link';
import { getFaculties, getDepartmentsByFaculty, submitStaffProposal } from '@/services/api';

// Define TypeScript interfaces
interface Faculty {
  _id: string;
  code: string;
  title: string;
}

interface Department {
  _id: string;
  code: string;
  title: string;
  faculty: string;
}

interface FormData {
  fullName: string;
  academicRank: string;
  department?: string; // Made optional
  faculty?: string; // Made optional
  unibenEmail: string;
  alternativeEmail: string;
  phoneNumber: string;
  coInvestigators: string;
  coInvestigatorsDept: string;
  projectTitle: string;
  problemStatement: string;
  researchObjectives: string;
  methodology: string;
  expectedOutcomes: string;
  workPlan: string;
  estimatedBudget: string;
  cvFile: File | null;
}

interface FormErrors {
  unibenEmail: string;
  alternativeEmail: string;
}

export default function TETFundForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    academicRank: '',
    department: '',
    faculty: '',
    unibenEmail: '',
    alternativeEmail: '',
    phoneNumber: '',
    coInvestigators: '',
    coInvestigatorsDept: '',
    projectTitle: '',
    problemStatement: '',
    researchObjectives: '',
    methodology: '',
    expectedOutcomes: '',
    workPlan: '',
    estimatedBudget: '',
    cvFile: null
  });

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [formErrors, setFormErrors] = useState<FormErrors>({
    unibenEmail: '',
    alternativeEmail: ''
  });

  const [fileError, setFileError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load faculties on component mount
  useEffect(() => {
    const loadFaculties = async () => {
      try {
        setLoading(true);
        const facultyData = await getFaculties();
        setFaculties(facultyData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load faculties:', error);
        setLoading(false);
      }
    };

    loadFaculties();
  }, []);

  // Load departments based on selected faculty
  const loadDepartments = useCallback(async (facultyValue: string) => {
    if (!facultyValue) return;
    
    try {
      setLoading(true);
      
      // First, find the faculty by its ID to get the code
      const selectedFaculty = faculties.find(f => f._id === facultyValue);
      
      if (!selectedFaculty) {
        console.error('Selected faculty not found');
        setLoading(false);
        return;
      }
      
      // Use the faculty code to fetch departments
      const departmentData = await getDepartmentsByFaculty(selectedFaculty.code);
      setDepartments(departmentData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setLoading(false);
    }
  }, [faculties]);

  // Load saved form data from localStorage
  useEffect(() => {
    localStorage.removeItem("savedInputs")
    const retrievedInputs = localStorage.getItem("v2SavedInputs");
    if (retrievedInputs) {
      const savedData = JSON.parse(retrievedInputs);
      setFormData(prevData => ({
        ...prevData,
        ...savedData,
        cvFile: null // Files can't be stored in localStorage
      }));

      // If a faculty was selected, load the departments
      if (savedData.faculty) {
        loadDepartments(savedData.faculty);
      }
    }
  }, [loadDepartments]);

  // Modified loadDepartments function

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Special handling for faculty selection
    if (name === 'faculty') {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
        department: '' // Reset department when faculty changes
      }));

      // Load departments for selected faculty
      loadDepartments(value);
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }

    // Clear errors when user is typing
    if (name === 'unibenEmail' || name === 'alternativeEmail') {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }

    // Save to localStorage (excluding file, faculty, and department)
    const dataToSave = {
      fullName: formData.fullName,
      academicRank: formData.academicRank,
      unibenEmail: formData.unibenEmail,
      alternativeEmail: formData.alternativeEmail,
      phoneNumber: formData.phoneNumber,
      coInvestigators: formData.coInvestigators,
      coInvestigatorsDept: formData.coInvestigatorsDept,
      projectTitle: formData.projectTitle,
      problemStatement: formData.problemStatement,
      researchObjectives: formData.researchObjectives,
      methodology: formData.methodology,
      expectedOutcomes: formData.expectedOutcomes,
      workPlan: formData.workPlan,
      estimatedBudget: formData.estimatedBudget,
      // Exclude cvFile, faculty, and department
    };

    localStorage.setItem(
      "v2SavedInputs",
      JSON.stringify({...dataToSave, [name]: value})
    );
  };

  // Validate UNIBEN email (must end with .uniben.edu, allowing subdomains)
  const validateUnibenEmail = (email: string): boolean => {
    const unibenEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*uniben\.edu$/;
    return unibenEmailRegex.test(email);
  };

  // Validate regular email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Email validation on blur
  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'unibenEmail' && value) {
      if (!validateUnibenEmail(value)) {
        setFormErrors(prevErrors => ({
          ...prevErrors,
          unibenEmail: 'Please enter a valid UNIBEN email address'
        }));
      }
    } else if (name === 'alternativeEmail' && value) {
      if (!validateEmail(value)) {
        setFormErrors(prevErrors => ({
          ...prevErrors,
          alternativeEmail: 'Please enter a valid email address'
        }));
      }
    }
  };

  const validateFile = (file: File): boolean => {
    // Reset error
    setFileError('');
    
    // Check file type
    const acceptedFormats = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!acceptedFormats.includes(file.type)) {
      setFileError('Only PDF or DOC/DOCX files are accepted');
      return false;
    }
    
    // Check file size (2MB max)
    if (file.size > 3 * 1024 * 1024) {
      setFileError('File size should not exceed 3MB');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setFormData(prevData => ({
          ...prevData,
          cvFile: file
        }));
      } else {
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setFormData(prevData => ({
          ...prevData,
          cvFile: file
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Email validation before submission
    let hasErrors = false;
    const newErrors = { unibenEmail: '', alternativeEmail: '' };
    
    if (!validateUnibenEmail(formData.unibenEmail)) {
      newErrors.unibenEmail = 'Please enter a valid UNIBEN email address ending with @uniben.edu';
      hasErrors = true;
    }
    
    if (!formData.alternativeEmail) {
      newErrors.alternativeEmail = 'Alternative email address is required';
      hasErrors = true;
    } else if (formData.alternativeEmail && !validateEmail(formData.alternativeEmail)) {
    newErrors.alternativeEmail = 'Please enter a valid email address';
    hasErrors = true;
    }
    
    // Final file validation check
    if (!formData.cvFile) {
      setFileError('Please upload your CV document');
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }
    
    try {
    setSubmitting(true);
    setSubmitError('');
    
    // Prepare form data for submission
    const apiFormData = new FormData();
    
    // Add all required fields according to the schema
    apiFormData.append('fullName', formData.fullName);
    apiFormData.append('academicTitle', formData.academicRank);
    // Conditionally append department and faculty
    if (formData.department) {
      apiFormData.append('department', formData.department);
    }
    if (formData.faculty) {
      apiFormData.append('faculty', formData.faculty);
    }
    apiFormData.append('email', formData.unibenEmail);
    apiFormData.append('phoneNumber', formData.phoneNumber);
    apiFormData.append('projectTitle', formData.projectTitle);
    apiFormData.append('backgroundProblem', formData.problemStatement);
    apiFormData.append('researchObjectives', formData.researchObjectives);
    apiFormData.append('methodologyOverview', formData.methodology);
    apiFormData.append('expectedOutcomes', formData.expectedOutcomes);
    apiFormData.append('workPlan', formData.workPlan);
    
    // Fix for estimatedBudget: Remove commas and convert to number
    const cleanedBudget = formData.estimatedBudget.replace(/,/g, '');
    apiFormData.append('estimatedBudget', cleanedBudget);
    
    // Optional fields
    if (formData.alternativeEmail) {
      apiFormData.append('alternativeEmail', formData.alternativeEmail);
    }
    
    // Handle co-investigators
    if (formData.coInvestigators && formData.coInvestigatorsDept) {
      try {
        // Parse co-investigators data
        const coInvNames = formData.coInvestigators.split(',').map(name => name.trim());
        const coInvDepts = formData.coInvestigatorsDept.split(',').map(dept => dept.trim());
        
        const coInvestigators = coInvNames.map((name, index) => {
          const deptInfo = coInvDepts[index] || '';
          const [department, faculty] = deptInfo.split(':').map(item => item.trim());
          
          return {
            name,
            department: department || '',
            faculty: faculty || '' 
          };
        });
        
        // Don't stringify the array - the server expects an array, not a string
        apiFormData.append('coInvestigators', JSON.stringify(coInvestigators));
      } catch (parseError) {
        console.error('Error parsing co-investigators:', parseError);
        // Use empty array instead of stringifying it
        apiFormData.append('coInvestigators', JSON.stringify([]));
      }
    } else {
      // Always include this field even if empty
      apiFormData.append('coInvestigators', JSON.stringify([]));
    }
      
      // Append CV file
      if (formData.cvFile) {
        apiFormData.append('cvFile', formData.cvFile);
      }
      
      // Submit the form
      const result = await submitStaffProposal(apiFormData);
      
      setSubmitSuccess(true);
      localStorage.removeItem("v2SavedInputs");
      
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const errorResponse = error.response as { status: number; data: { message: string } };
        if (errorResponse.status === 400) {
          setSubmitError(`Validation error: ${errorResponse.data.message || 'Please check all required fields'}`);
        } else if (errorResponse.status === 413) {
          setSubmitError('The file you uploaded is too large. Please ensure it is under 2MB.');
        } else {
          setSubmitError(`Failed to submit your proposal (Error ${errorResponse.status}). Please try again later.`);
        }
      } else {
        console.error('Unknown error:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      fullName: '',
      academicRank: '',
      department: '',
      faculty: '',
      unibenEmail: '',
      alternativeEmail: '',
      phoneNumber: '',
      coInvestigators: '',
      coInvestigatorsDept: '',
      projectTitle: '',
      problemStatement: '',
      researchObjectives: '',
      methodology: '',
      expectedOutcomes: '',
      workPlan: '',
      estimatedBudget: '',
      cvFile: null
    });
    
    // Clear any errors
    setFormErrors({ unibenEmail: '', alternativeEmail: '' });
    setFileError('');
    
    // Clear localStorage
    localStorage.removeItem("v2SavedInputs");
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Form */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-800 text-white px-6 py-4">
            <h1 className="text-xl font-semibold">TETFund IBR Concept Note Submission Form</h1>
            <p className="text-purple-200 text-sm mt-1">Complete all required fields below</p>
          </div>

          {submitError && (
            <div className="p-4 mb-4 border border-red-200 rounded-md bg-red-50">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-600">{submitError}</p>
              </div>
            </div>
          )}

          {submitSuccess ? (
            <div className="p-8 text-center">
              <div className="bg-green-50 border border-green-200 rounded-md p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-2">Proposal Submitted Successfully!</h2>
                <p className="text-green-700 mb-4">Your IBR concept note has been submitted and is now under review.</p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Submit Another Proposal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name of Lead Researcher *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Title/Rank *
                    </label>
                    <select
                      name="academicRank"
                      value={formData.academicRank}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    >
                      <option value="">Select an option</option>
                      <option value="Assistant Lecturer">Assistant Lecturer</option>
                      <option value="Lecturer II">Lecturer II</option>
                      <option value="Lecturer I">Lecturer I</option>
                      <option value="Senior Lecturer">Senior Lecturer</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faculty *
                    </label>
                    <select
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                      disabled={loading}
                    >
                      <option value="">Select a Faculty</option>
                      {faculties.map((faculty) => (
                        <option key={faculty._id} value={faculty._id}>
                          {faculty.title}
                        </option>
                      ))}
                    </select>
                    {loading && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Loading...
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                      disabled={!formData.faculty || loading}
                    >
                      <option value="">Select a Department</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>
                          {department.title}
                        </option>
                      ))}
                    </select>
                    {!formData.faculty && !loading && (
                      <p className="mt-1 text-xs text-amber-600">
                        Please select a Faculty first
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UNIBEN Email Address *
                    </label>
                    <input
                      type="email"
                      name="unibenEmail"
                      value={formData.unibenEmail}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      required
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border ${formErrors.unibenEmail ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="username@uniben.edu"
                    />
                    {formErrors.unibenEmail && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.unibenEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternative Email Address *
                    </label>
                    <input
                      type="email"
                      name="alternativeEmail"
                      value={formData.alternativeEmail}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border ${formErrors.alternativeEmail ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.alternativeEmail && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.alternativeEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>
              </div>

              {/* Research Team Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Research Team</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name(s) of Co-Investigator(s) (if applicable)
                    </label>
                    <textarea
                      name="coInvestigators"
                      value={formData.coInvestigators}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                      placeholder="Enter names separated by commas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department(s) and Faculty(ies) of Co-Investigator(s)
                    </label>
                    <textarea
                      name="coInvestigatorsDept"
                      value={formData.coInvestigatorsDept}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                      placeholder="Format: Name - Department, Faculty"
                    />
                  </div>
                </div>
              </div>

              {/* Rest of the form sections remain the same */}
              {/* Project Information Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Project Information</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      name="projectTitle"
                      value={formData.projectTitle}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background and Problem Statement (Max 200 words) *
                    </label>
                    <textarea
                      name="problemStatement"
                      value={formData.problemStatement}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.problemStatement.split(' ').filter(Boolean).length}/200 words
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Research Objectives (Clear and measurable) *
                    </label>
                    <textarea
                      name="researchObjectives"
                      value={formData.researchObjectives}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Methodology Overview (Max 250 words) *
                    </label>
                    <textarea
                      name="methodology"
                      value={formData.methodology}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.methodology.split(' ').filter(Boolean).length}/250 words
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Outcomes and Impact *
                    </label>
                    <textarea
                      name="expectedOutcomes"
                      value={formData.expectedOutcomes}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brief Work Plan (Highlight main activities) *
                    </label>
                    <textarea
                      name="workPlan"
                      value={formData.workPlan}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Budget Summary (Indicative figure only) *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        ₦
                      </span>
                      <input
                        type="text"
                        name="estimatedBudget"
                        value={formData.estimatedBudget}
                        onChange={handleInputChange}
                        required
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        placeholder="1,000,000.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
<div className="mb-8">
  <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Upload Section</h2>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      Upload Short CV of Lead Researcher (Max 2 pages; PDF or DOC format) *
    </label>
    <div 
      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'} ${fileError ? 'border-red-300' : ''} border-dashed rounded-md`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-1 text-center">
        <Upload className={`mx-auto h-12 w-12 ${fileError ? 'text-red-400' : 'text-gray-400'}`} />
        <div className="flex text-sm text-gray-600">
          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
            <span>Upload a file</span>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              className="sr-only"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              ref={fileInputRef}
              required
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          PDF or DOC up to 2MB (max 2 pages)
        </p>
        {formData.cvFile && (
          <p className="text-sm text-green-600 mt-2">
            File selected: {formData.cvFile.name}
          </p>
        )}
        {fileError && (
          <div className="flex items-center mt-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {fileError}
          </div>
        )}
      </div>
    </div>
  </div>
</div>

{/* Submit Button */}
<div className="mt-8 border-t pt-6">
  <div className="flex justify-end">
    <button
      type="button"
      onClick={clearForm}
      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-4"
    >
      Clear form
    </button>
    <button
      type="submit"
      disabled={submitting}
      className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-800 hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      {submitting ? (
        <>
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
          Submitting...
        </>
      ) : (
        'Submit Application'
      )}
    </button>
  </div>
</div>
</form>
)}
</div>
</main>

{/* Footer */}
<footer className="bg-gray-100 mt-12">
  <div className="container mx-auto px-4 py-6">
    <p className="text-center text-sm text-gray-600">
      © {new Date().getFullYear()} DRID UNIBEN. All rights reserved.
    </p>
    <p className="text-center text-xs text-gray-500 mt-1">
      For technical support, please contact: <Link href="mailto:drid@uniben.edu" className="text-blue-500" title="send email">drid@uniben.edu</Link>
    </p>
  </div>
</footer>
</div>
);
}

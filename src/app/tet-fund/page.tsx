"use client"
import { useState, useRef, useEffect, useCallback  } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import Header from '@/components/header';
import Link from 'next/link';
import {
  getFacultyData,
  getSubmissionWindow,
  submitStaffProposal,
  type AcademicUnit,
  type AcademicDepartment,
} from '@/services/api';

// Format an ISO closesAt into a friendly, human-readable deadline.
// Falls back to "To be announced" when no date is set.
const formatDeadline = (iso: string | null): string => {
  if (!iso) return 'To be announced';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'To be announced';
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Define TypeScript interfaces
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

  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
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

  // Submission window (admin-controlled). Default OPEN with an unknown
  // deadline so a failed status call never blocks a legitimate submitter.
  const [submissionWindow, setSubmissionWindow] = useState<{
    isOpen: boolean;
    deadline: string;
    note: string | null;
  }>({ isOpen: true, deadline: 'To be announced', note: null });

  useEffect(() => {
    let active = true;
    getSubmissionWindow('staff_concept')
      .then((w) => {
        if (!active) return;
        setSubmissionWindow({
          isOpen: w.isOpen,
          deadline: formatDeadline(w.closesAt),
          note: w.note,
        });
      })
      .catch((error) => {
        console.error('Failed to load submission window:', error);
        // Keep the OPEN default — never block on a failed status call.
      });
    return () => {
      active = false;
    };
  }, []);

  // Load faculties on component mount
  useEffect(() => {
    const loadFaculties = async () => {
      try {
        setLoading(true);
        const data = await getFacultyData();
        setUnits(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load faculties:', error);
        setLoading(false);
      }
    };

    loadFaculties();
  }, []);

  // Departments come from the selected unit in the nested dataset (Option A:
  // faculty/department are title strings, no extra request needed).
  const loadDepartments = useCallback(
    (facultyTitle: string) => {
      if (!facultyTitle) {
        setDepartments([]);
        return;
      }
      const unit = units.find((u) => u.title === facultyTitle);
      setDepartments(unit ? unit.departments : []);
    },
    [units]
  );

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
    return unibenEmailRegex.test(email.trim().toLowerCase());
  };

  // Validate regular email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim().toLowerCase());
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
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size should not exceed 10MB');
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
    apiFormData.append('email', formData.unibenEmail.trim().toLowerCase());
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
      apiFormData.append('alternativeEmail', formData.alternativeEmail.trim().toLowerCase());
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
      await submitStaffProposal(apiFormData);
      
      setSubmitSuccess(true);
      localStorage.removeItem("v2SavedInputs");
      
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const errorResponse = error.response as { status: number; data: { message: string } };
        if (errorResponse.status === 400) {
          setSubmitError(`Validation error: ${errorResponse.data.message || 'Please check all required fields'}`);
        } else if (errorResponse.status === 413) {
          setSubmitError('The file you uploaded is too large. Please ensure it is under 10MB.');
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
    <div className="min-h-screen bg-[#faf7fc] text-[#2b1229]">
      {/* Header */}
      <Header />

      {/* Main Form */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto rounded-2xl border border-[#e6d9e6] bg-white/80 overflow-hidden shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)]">
          <div className="bg-gradient-to-br from-[#4a0340] to-[#6d035c] text-white px-7 py-7">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e9c96b]">
                TETFund IBR · Concept Note
              </p>
              <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#f3e7d0] ring-1 ring-white/20">
                Deadline: {submissionWindow.deadline}
              </span>
            </div>
            <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-semibold tracking-tight">
              Let&apos;s set up your submission
            </h1>
            <p className="text-[#e7d3e4] text-sm mt-2 leading-relaxed">
              A few details about you and your project. Take your time — your
              answers are saved on this device as you go.
            </p>
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
              <div className="rounded-xl border border-[#cfe6d4] bg-[#f2faf3] p-8">
                <h2 className="text-2xl font-semibold tracking-tight text-[#1f5b34] mb-2">Thank you — your proposal is in.</h2>
                <p className="text-[#3d6b4c] mb-5 leading-relaxed">Your IBR concept note has been submitted and is now with the review team. Keep an eye on your UNIBEN email.</p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="inline-flex justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-[#1f5b34] hover:bg-[#184727] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f5b34]/40"
                >
                  Submit Another Proposal
                </button>
              </div>
            </div>
          ) : !submissionWindow.isOpen ? (
            <div className="p-8 text-center">
              <div className="rounded-xl border border-[#e6d9e6] bg-[#faf7fc] p-8">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#4a0340] mb-2">
                  Submissions are currently closed
                </h2>
                <p className="text-[#6b5566] leading-relaxed max-w-prose mx-auto">
                  The submission window for TETFund IBR concept notes is not open
                  right now. Please check back closer to the next call for
                  proposals.
                </p>
                {submissionWindow.note && (
                  <p className="mt-4 text-sm text-[#6b5566] leading-relaxed max-w-prose mx-auto">
                    {submissionWindow.note}
                  </p>
                )}
                <p className="mt-5 text-sm text-[#6b5566]">
                  Questions? Email{' '}
                  <Link href="mailto:drid@uniben.edu" className="font-medium text-[#6d035c] underline hover:text-[#4a0340]" title="send email">
                    drid@uniben.edu
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information Section */}
              <div className="mb-8">
                <h2 className="text-base font-semibold tracking-tight text-[#4a0340] mb-4 pb-2 border-b border-[#ecdfec]">Basic Information</h2>
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                      disabled={loading}
                    >
                      <option value="">Select a Faculty</option>
                      {units.map((unit) => (
                        <option key={unit.code} value={unit.title}>
                          {unit.title}
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                      disabled={!formData.faculty || loading}
                    >
                      <option value="">Select a Department</option>
                      {departments.map((department) => (
                        <option key={department.code} value={department.title}>
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
                      className={`mt-1 block w-full rounded-lg bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20 border ${formErrors.unibenEmail ? 'border-red-500' : 'border-[#e0d3e0]'}`}
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
                      className={`mt-1 block w-full rounded-lg bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20 border ${formErrors.alternativeEmail ? 'border-red-500' : 'border-[#e0d3e0]'}`}
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Research Team Section */}
              <div className="mb-8">
                <h2 className="text-base font-semibold tracking-tight text-[#4a0340] mb-4 pb-2 border-b border-[#ecdfec]">Research Team</h2>
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                      placeholder="Format: Name - Department, Faculty"
                    />
                  </div>
                </div>
              </div>

              {/* Rest of the form sections remain the same */}
              {/* Project Information Section */}
              <div className="mb-8">
                <h2 className="text-base font-semibold tracking-tight text-[#4a0340] mb-4 pb-2 border-b border-[#ecdfec]">Project Information</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title * <span className="text-gray-400 font-normal">(max 300 characters)</span>
                    </label>
                    <input
                      type="text"
                      name="projectTitle"
                      value={formData.projectTitle}
                      onChange={handleInputChange}
                      required
                      minLength={5}
                      maxLength={300}
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                    />
                    <p className="mt-1 text-xs text-gray-400">{formData.projectTitle.length}/300</p>
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
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
                      className="mt-1 block w-full rounded-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Budget Summary (Indicative figure only) *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#e0d3e0] bg-[#f4eef3] text-[#6b5566] sm:text-sm">
                        ₦
                      </span>
                      <input
                        type="text"
                        name="estimatedBudget"
                        value={formData.estimatedBudget}
                        onChange={handleInputChange}
                        required
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-lg border border-[#e0d3e0] bg-white px-3 py-2.5 text-sm text-[#2b1229] shadow-sm transition-colors placeholder:text-[#a48fa0] focus:border-[#6d035c] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/20"
                        placeholder="1,000,000.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
<div className="mb-8">
  <h2 className="text-base font-semibold tracking-tight text-[#4a0340] mb-4 pb-2 border-b border-[#ecdfec]">Upload Section</h2>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      Upload Short CV of Lead Researcher (Max 2 pages; PDF or DOC format) *
    </label>
    <div 
      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-[#6d035c] bg-[#f3e8f2]' : 'border-gray-300'} ${fileError ? 'border-red-300' : ''} border-dashed rounded-md`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-1 text-center">
        <Upload className={`mx-auto h-12 w-12 ${fileError ? 'text-red-400' : 'text-gray-400'}`} />
        <div className="flex text-sm text-gray-600">
          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#6d035c] hover:text-[#4a0340]">
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
          PDF or DOC up to 10MB (max 2 pages)
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
      className="mr-4 inline-flex justify-center rounded-full border border-[#e0d3e0] bg-white px-6 py-2.5 text-sm font-semibold text-[#4a0340] transition-colors hover:bg-[#f3e8f2] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6d035c]/30"
    >
      Clear form
    </button>
    <button
      type="submit"
      disabled={submitting}
      className="inline-flex items-center justify-center rounded-full bg-[#6d035c] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a0340] focus:outline-none focus:ring-2 focus:ring-[#6d035c]/30 focus:ring-offset-2 disabled:opacity-60"
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
      For technical support, please contact: <Link href="mailto:drid@uniben.edu" className="text-[#6d035c] hover:text-[#4a0340]" title="send email">drid@uniben.edu</Link>
    </p>
  </div>
</footer>
</div>
);
}
"use client";

import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Send, Loader2 } from 'lucide-react';
import { submitMasterProposal } from '@/services/api';
import Header from "@/components/header";
import Link from 'next/link';

export default function MastersFundingPage() {
  // Agreement state
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showFullGuidelines, setShowFullGuidelines] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    alternativeEmail: '',
    phoneNumber: '',
  });
  
  // File states
  const [document, setDocument] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState('');
  
  // Validation states
  const [formErrors, setFormErrors] = useState({
    email: '',
    alternativeEmail: ''
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user is typing
    if (name === 'email' || name === 'alternativeEmail') {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Email validation on blur
  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value) {
      if (!validateUnibenEmail(value)) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Please enter a valid UNIBEN email address'
        }));
      }
    } else if (name === 'alternativeEmail' && value) {
      if (!validateEmail(value)) {
        setFormErrors(prev => ({
          ...prev,
          alternativeEmail: 'Please enter a valid email address'
        }));
      }
    }
  };

  // File validation and handling
  const validateFile = (file: File): boolean => {
    // Reset error
    setFileError('');
    
    // Check file type
    const acceptedFormats = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!acceptedFormats.includes(file.type)) {
      setFileError('Only PDF or DOC/DOCX files are accepted');
      return false;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size should not exceed 5MB');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setDocument(file);
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
        setDocument(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    let hasErrors = false;
    const newErrors = { email: '', alternativeEmail: '' };
    
    if (!validateUnibenEmail(formData.email)) {
      newErrors.email = 'Please enter a valid UNIBEN email address ending with uniben.edu';
      hasErrors = true;
    }
    
    if (!formData.alternativeEmail) {
      newErrors.alternativeEmail = 'Alternative email address is required';
      hasErrors = true;
    } else if (formData.alternativeEmail && !validateEmail(formData.alternativeEmail)) {
      newErrors.alternativeEmail = 'Please enter a valid email address';
      hasErrors = true;
    }
    
    if (!document) {
      setFileError('Please upload your concept note document');
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Create FormData for API submission
      const apiFormData = new FormData();
      apiFormData.append('fullName', formData.fullName);
      apiFormData.append('email', formData.email);
      if (formData.alternativeEmail) {
        apiFormData.append('alternativeEmail', formData.alternativeEmail);
      }
      apiFormData.append('phoneNumber', formData.phoneNumber);
      
      // Append document file with the correct field name expected by the API
      if (document) {
        apiFormData.append('docFile', document);
      }
      
      // Submit to API
      await submitMasterProposal(apiFormData);
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitError('Failed to submit your proposal. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      alternativeEmail: '',
      phoneNumber: '',
    });
    setDocument(null);
    setFileError('');
    setIsSubmitted(false);
    setSubmitError('');
    setFormErrors({ email: '', alternativeEmail: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAgreementChecked(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#faf7fc] text-[#2b1229]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-[#4a0340] to-[#6d035c] text-white px-6 py-5">
              <h1 className="text-xl font-semibold">Master&apos;s Funding Concept Note Submission</h1>
            </div>
            <div className="p-8 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Submission Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your concept note has been submitted successfully. You will receive a confirmation email shortly.
              </p>
              <button
                onClick={resetForm}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#6d035c] hover:bg-[#4a0340]"
              >
                Submit Another Document
              </button>
            </div>
          </div>
        </main>
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

  return (
    <div className="min-h-screen bg-[#faf7fc] text-[#2b1229]">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Guidelines Section */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-purple-800 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">Submission Guidelines</h1>
          </div>
          
          <div className="p-6 text-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">
              Pilot Seed Funding for Research-Driven Innovation
            </h2>
            <p className="mb-4 text-gray-700">
              Directorate of Research, Innovation and Development (DRID), University of Benin, Benin City.
            </p>
            <p className="mb-4 font-medium text-gray-800">
              <strong>Concept Note Submission Template (Master&apos;s Students Only)</strong>
            </p>

            {showFullGuidelines ? (
              <>
                <p className="mb-6 text-gray-700">
                  Please complete all fields clearly and accurately. Maximum of 5 pages excluding the budget appendix.
                </p>

                <ol className="list-decimal list-inside space-y-6 text-gray-800">
                  <li>
                    <strong className="text-purple-800">Project Title:</strong> 
                    <span className="block mt-1 text-gray-700">Provide a clear and descriptive title for your project.</span>
                  </li>
                  <li>
                    <strong className="text-purple-800">Lead Researcher Information:</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 text-gray-700">
                      <li>Full Name</li>
                      <li>Matriculation Number</li>
                      <li>Programme (e.g., MSc, MA, LLM)</li>
                      <li>Department and Faculty</li>
                      <li>Email Address</li>
                      <li>Phone Number</li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-purple-800">Problem Statement and Justification:</strong>
                    <span className="block mt-1 text-gray-700">
                      Briefly describe the problem your project addresses and explain why it is important.
                    </span>
                  </li>
                  <li>
                    <strong className="text-purple-800">Objectives and Anticipated Outcomes:</strong>
                    <span className="block mt-1 text-gray-700">
                      What are you aiming to achieve? What changes, benefits, or results do you expect from your project?
                    </span>
                  </li>
                  <li>
                    <strong className="text-purple-800">Research-Informed Approach and Methodology:</strong>
                    <span className="block mt-1 text-gray-700">
                      Explain how you will carry out your research, the methods you will use, and how it is informed by academic knowledge.
                    </span>
                  </li>
                  <li>
                    <strong className="text-purple-800">Innovation and Impact:</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 text-gray-700">
                      <li>What is novel about your project?</li>
                      <li>How could your project contribute to society, culture, policy, or national development?</li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-purple-800">Interdisciplinary Relevance:</strong>
                    <span className="block mt-1 text-gray-700">
                      Show how your project draws from or benefits multiple fields of study, if applicable.
                    </span>
                  </li>
                  <li>
                    <strong className="text-purple-800">Implementation Plan and Timeline:</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 text-gray-700">
                      <li>Outline the main activities and stages of the project.</li>
                      <li>Provide a realistic timeline covering completion within one academic session.</li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-purple-800">Preliminary Budget Estimate (Separate Appendix):</strong>
                    <span className="block mt-1 text-gray-700">
                      Break down how you propose to use the seed funding if awarded, with estimated costs.
                    </span>
                  </li>
                </ol>

                <h3 className="text-lg font-semibold mt-8 text-purple-800">Important Submission Details:</h3>
                <ul className="list-disc list-inside space-y-2 mt-4 text-gray-700">
                  <li>Concept note must not exceed 5 pages (excluding appendix).</li>
                  <li>
                    Submission Email:{" "}
                    <a href="mailto:drid@uniben.edu" className="text-purple-800 underline">
                      drid@uniben.edu
                    </a>
                  </li>
                  <li>Deadline: Tuesday, 3rd June 2025</li>
                  <li>
                    For inquiries, contact the DRID Office or email{" "}
                    <a href="mailto:drid@uniben.edu" className="text-purple-800 underline">
                      drid@uniben.edu
                    </a>.
                  </li>
                </ul>

                <button 
                  onClick={() => setShowFullGuidelines(false)}
                  className="mt-6 text-purple-600 hover:text-purple-800 underline"
                >
                  Hide full guidelines
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-gray-700">
                  Please prepare a concept note document (maximum 5 pages excluding appendix) following the submission guidelines.
                </p>
                <p className="text-gray-700 mb-4">
                  Your document should include all required sections: project title, lead researcher information, problem statement, objectives, methodology, innovation and impact, interdisciplinary relevance, implementation plan, and budget estimate.
                </p>
                <button 
                  onClick={() => setShowFullGuidelines(true)}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  Read full guidelines
                </button>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={() => setAgreementChecked(!agreementChecked)}
                  className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-gray-800">
                  I confirm that I have read and understood the submission guidelines
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Form and Upload Section - Only visible after agreement */}
        {agreementChecked && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-[#4a0340] to-[#6d035c] text-white px-6 py-5">
              <h1 className="text-xl font-semibold">Master&apos;s Funding Concept Note Submission</h1>
            </div>
            
            {submitError && (
              <div className="p-4 mb-4 border border-red-200 rounded-md bg-red-50 mx-6 mt-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-600">{submitError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              {/* Personal Information Section */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
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
                      UNIBEN Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      required
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="username@uniben.edu"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.email}
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
              
              {/* Document Upload Section */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Concept Note Upload</h2>
                <p className="text-gray-700 mb-6">
                  Please upload your complete concept note document (maximum 5 pages excluding appendix).
                  Ensure your document includes all required sections as outlined in the submission guidelines.
                </p>
                
                <div 
                  className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 ${
                    isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                  } ${fileError ? 'border-red-300' : ''} border-dashed rounded-md`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-3 text-center">
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
                      PDF or DOC/DOCX up to 5MB (max 5 pages excluding appendix)
                    </p>
                    {document && (
                      <div className="mt-4 text-sm text-green-600 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>File selected: {document.name}</span>
                      </div>
                    )}
                    {fileError && (
                      <div className="flex items-center justify-center mt-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {fileError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  disabled={!document || isSubmitting}
                  className={`inline-flex items-center justify-center py-2 px-6 border border-transparent text-base font-medium rounded-md text-white ${
                    !document || isSubmitting ? 'bg-purple-400 cursor-not-allowed' : 'bg-[#6d035c] hover:bg-[#4a0340]'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Submit Concept Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
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
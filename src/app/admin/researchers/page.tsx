"use client";

import { useState, useEffect } from "react";
import * as api from "@/services/api";
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link'; // Import Link
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown Menu components
import { Toaster, toast } from "sonner"; // Import Toaster and toast from sonner

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, MoreVertical, Loader2 } from "lucide-react"; // Import MoreVertical and Loader2
import { Button } from "@/components/ui/button"; // Import Button

// Define the interface for researcher data based on the API response
interface Researcher {
  _id: string; // Changed from id to _id
  name: string;
  email: string;
  credentialsSent: boolean; // Corrected from credentialsSent to credentialsSent
  // Add other relevant researcher fields here
}

function AdminResearchersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>(""); // Add success state
  const [sendingCredentials, setSendingCredentials] = useState<string | null>(null); // State for send loading
  const [resendingCredentials, setResendingCredentials] = useState<string | null>(null); // State for resend loading

  const router = useRouter();
  // Removed useToast initialization

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const response = await api.getResearchersWithProposals(); // Use the correct API
        setResearchers(response.data); // Assuming response.data is the array of researchers
        setIsLoading(false);
      } catch (error: unknown) {
        console.error("Error fetching researchers:", error);
        setError((error as Error).message || "Failed to load researchers");
        setIsLoading(false);
      }
    };

    fetchResearchers();
  }, []); // Empty dependency array to fetch data only once

  const handleSendCredentials = async (researcherId: string) => {
    setSendingCredentials(researcherId); // Set loading state for this researcher
    setError("");
    setSuccess("");
    try {
      await api.sendResearcherCredentials(researcherId);
      setSuccess("Credentials sent successfully.");
      toast.success("Credentials sent successfully."); // Use sonner toast.success
      // Update the researcher's status in the local state
      setResearchers(researchers.map(r =>
        r._id === researcherId ? { ...r, credentialsSent: true } : r
      ));
    } catch (error: unknown) {
      console.error("Error sending credentials:", error);
      const errorMessage = (error as Error).message || "Failed to send credentials.";
      setError(errorMessage);
       toast.error(errorMessage); // Use sonner toast.error
    } finally {
      setSendingCredentials(null); // Unset loading state
    }
  };

  const handleResendCredentials = async (researcherId: string) => { // Modified to accept researcherId
    setResendingCredentials(researcherId); // Set loading state for this researcher
    setError("");
    setSuccess("");
    try {
      await api.resendResearcherCredentials(researcherId); // Use researcherId parameter
      setSuccess("Credentials resent successfully.");
       toast.success(success); // Use sonner toast.success
      // No need to close dialog or reset selected researcher state
    } catch (error: unknown) {
      console.error("Error resending credentials:", error);
       const errorMessage = (error as Error).message || "Failed to resend credentials.";
      setError(errorMessage);
       toast.error(errorMessage); // Use sonner toast.error
    } finally {
      setResendingCredentials(null); // Unset loading state
    }
  };

  // Removed functions related to Dialog state

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Researchers
          </h1>
          {/* Add any buttons or actions here if needed */}
        </div>

        {/* Researchers List */}
        <Card>
          <CardHeader>
            <CardTitle>Researchers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Removed TooltipProvider */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Credential Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{researchers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No researchers found.
                        </td>
                      </tr>
                    ) : (
                      researchers.map((researcher) => (
                        <tr
                          key={researcher._id} // Added unique key prop
                          className="border-b hover:bg-muted" // Removed cursor-pointer
                          // Removed onClick handler
                        >
                          {/* Content of the row */}
                          <td className="px-4 py-3 font-medium">
                            {researcher.name}
                          </td>
                          <td className="px-4 py-3">{researcher.email}</td>
                          <td className="px-4 py-3">
                            {researcher.credentialsSent ? "sent" : "pending"}
                          </td>
                          <td className="px-4 py-3">
                            {/* Action buttons - conditional rendering based on credentialsSent */}
                            {!researcher.credentialsSent && (
                              <Button
                                variant="default" // Changed variant to default for theme color
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  handleSendCredentials(researcher._id); // Changed to _id
                                }}
                                disabled={sendingCredentials === researcher._id} // Disable when sending
                              >
                                {sendingCredentials === researcher._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Send Credentials
                              </Button>
                            )}
                            {/* Vertical dot button and resend action dropdown trigger */}
                            {researcher.credentialsSent && (
                              <DropdownMenu> {/* Use DropdownMenu */}
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end"> {/* Use DropdownMenuContent */}
                                  {/* Removed alert messages from dropdown */}
                                   <DropdownMenuItem> {/* Added View button */}
                                      <Link href={`/admin/researchers/${researcher._id}`} className="w-full">View</Link>
                                    </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleResendCredentials(researcher._id)} // Use DropdownMenuItem and pass researcher._id
                                    disabled={resendingCredentials === researcher._id} // Disable when resending
                                  >
                                     {resendingCredentials === researcher._id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Resend Credentials
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      ))
                    )}</tbody>
                </table>
              {/* Removed TooltipProvider */}
            </div>
          </CardContent>
        </Card>
        {/* Keep global success/error alerts outside the table if needed */}
        {/* Removed global success/error alerts */}
      </div>
       <Toaster /> {/* Add Toaster component */}
    </AdminLayout>
    );
  }

export default AdminResearchersPage;

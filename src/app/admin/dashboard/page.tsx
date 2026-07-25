"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProposalStatistics } from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, FileText, UserCheck, Users, Flag  } from 'lucide-react';

interface StatisticsData {
  total: number;
  byType: {
    staff: number;
    master_student: number;
  };
  byStatus: {
    [key: string]: number;
  };
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const data = await getProposalStatistics();
        setStatistics(data.data);
      } catch (err) {
        console.error('Failed to load statistics:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadStatistics();
    }
  }, [isAuthenticated]);

  // Transform status data for chart
  const getStatusChartData = () => {
    if (!statistics?.byStatus) return [];
    
    const statusLabels: { [key: string]: string } = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      revision_requested: 'Needs Revision'
    };
    
    return Object.entries(statistics.byStatus).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count
    }));
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : statistics ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Total Proposals Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-muted-foreground truncate">Total Proposals</dt>
                          <dd>
                            <div className="text-lg font-medium text-foreground">{statistics.total}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Proposals Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-[#6d035c]/10 rounded-md p-3">
                        <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-muted-foreground truncate">Staff Proposals</dt>
                          <dd>
                            <div className="text-lg font-medium text-foreground">{statistics.byType.staff}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Proposals Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <Users className="h-6 w-6 text-green-800" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-muted-foreground truncate">Master Student Proposals</dt>
                          <dd>
                            <div className="text-lg font-medium text-foreground">{statistics.byType.master_student}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approved Proposals Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <Flag className="h-6 w-6 text-yellow-800" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-muted-foreground truncate">Approved Proposals</dt>
                          <dd>
                            <div className="text-lg font-medium text-foreground">
                              {statistics.byStatus.approved || 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Chart */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-foreground mb-4">Proposals by Status</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getStatusChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7e22ce" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}
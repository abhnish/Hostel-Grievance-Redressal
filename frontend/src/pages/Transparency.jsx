import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";

const Transparency = () => {
  const [kpiData, setKpiData] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    unresolvedComplaints: 0,
    wardStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        // Fetch complaints data
        const complaintsResponse = await fetch("http://localhost:3000/complaints");
        const complaintsData = await complaintsResponse.json();
        
        // Fetch wards data
        const wardsResponse = await fetch("http://localhost:3000/wards");
        const wardsData = await wardsResponse.json();

        if (Array.isArray(complaintsData)) {
          const total = complaintsData.length;
          const resolved = complaintsData.filter(c => c.status === 'resolved').length;
          const unresolved = total - resolved;

          // Calculate ward-wise statistics
          const wardStats = wardsData.map(ward => {
            const wardComplaints = complaintsData.filter(c => c.ward_id === ward.ward_id);
            const wardUnresolved = wardComplaints.filter(c => c.status !== 'resolved').length;
            
            return {
              wardName: ward.ward_name,
              totalComplaints: wardComplaints.length,
              unresolvedComplaints: wardUnresolved
            };
          });

          setKpiData({
            totalComplaints: total,
            resolvedComplaints: resolved,
            unresolvedComplaints: unresolved,
            wardStats: wardStats
          });
        }
      } catch (err) {
        console.error("Error fetching KPI data:", err);
        setError("Failed to load transparency data");
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  const resolutionRate = kpiData.totalComplaints > 0 
    ? Math.round((kpiData.resolvedComplaints / kpiData.totalComplaints) * 100)
    : 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-600">Loading transparency data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="text-red-600">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Transparency Dashboard</h1>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Requests</h3>
              <p className="text-3xl font-bold text-blue-600">{kpiData.totalComplaints}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Resolved Requests</h3>
              <p className="text-3xl font-bold text-green-600">{kpiData.resolvedComplaints}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Resolution Rate</h3>
              <p className="text-3xl font-bold text-purple-600">{resolutionRate}%</p>
            </div>
          </div>

          {/* Ward-wise Statistics */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Ward-wise Statistics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ward Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unresolved Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kpiData.wardStats.length > 0 ? (
                    kpiData.wardStats.map((ward, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ward.wardName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ward.totalComplaints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ward.unresolvedComplaints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ward.unresolvedComplaints === 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ward.unresolvedComplaints === 0 ? 'Clear' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Summary</h3>
            <p className="text-blue-700">
              This transparency dashboard provides real-time insights into municipal service requests 
              across all wards. Our commitment to openness ensures citizens can track the status 
              and resolution of their public service requests.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transparency;

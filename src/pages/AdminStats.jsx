import { useState, useEffect } from 'react'
import { BarChart3, Package, Users, Layers, AlertTriangle, TrendingUp } from 'lucide-react'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AdminStats = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentBatches, setRecentBatches] = useState([])
  const [supplierAlerts, setSupplierAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/')
      return
    }

    if (user?.role === 'admin') {
      fetchAdminData()
    }
  }, [user, navigate])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [statsData, batchesData, alertsData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentBatches(),
        dashboardAPI.getSupplierAlerts(),
      ])

      setStats(statsData)
      setRecentBatches(batchesData)
      setSupplierAlerts(alertsData)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
          Admin Statistics
        </h1>
        <p className="mt-2 text-gray-600">Comprehensive analytics and insights for administrators</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading admin statistics...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Raw Materials</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stats?.totalRawMaterials?.value || 0}
                  </p>
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stats?.totalRawMaterials?.change || '+0%'} from last month
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stats?.activeSuppliers?.value || 0}
                  </p>
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stats?.activeSuppliers?.change || '+0%'} from last month
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Batches</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stats?.activeBatches?.value || 0}
                  </p>
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stats?.activeBatches?.change || '+0%'} from last month
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Layers className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Alerts</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stats?.pendingAlerts?.value || 0}
                  </p>
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Requires attention
                  </p>
                </div>
                <div className="bg-red-500 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Batches</h2>
              {recentBatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No recent batches</div>
              ) : (
                <div className="space-y-4">
                  {recentBatches.map((batch) => (
                    <div key={batch._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                        <p className="text-sm text-gray-500">
                          {batch.rawMaterial?.name || 'N/A'} - {new Date(batch.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {batch.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Supplier Alerts</h2>
              {supplierAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No alerts</div>
              ) : (
                <div className="space-y-4">
                  {supplierAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alert.type}</p>
                        <p className="text-sm text-gray-500">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminStats

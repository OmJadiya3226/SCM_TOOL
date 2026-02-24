import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Users, Layers, AlertTriangle } from 'lucide-react'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import DashboardCharts from '../components/dashboard/DashboardCharts'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState([
    {
      title: 'Total Raw Materials',
      value: '0',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Suppliers',
      value: '0',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Active Batches',
      value: '0',
      icon: Layers,
      color: 'bg-purple-500',
    },
    {
      title: 'Important Alerts',
      value: '0',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ])
  const [recentBatches, setRecentBatches] = useState([])
  const [supplierAlerts, setSupplierAlerts] = useState([])
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/suppliers')
      return
    }

    if (user?.role === 'admin') {
      fetchDashboardData()
    }
  }, [user, navigate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Try to fetch admin stats, but handle errors gracefully for non-admin users
      const [statsData, batchesData, alertsData, chartDataRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentBatches(),
        dashboardAPI.getSupplierAlerts(),
        dashboardAPI.getChartData(),
      ])

      // Handle stats data (admin only)
      if (statsData.status === 'fulfilled') {
        setStats([
          {
            title: 'Total Raw Materials',
            value: statsData.value.totalRawMaterials.value.toString(),
            icon: Package,
            color: 'bg-blue-500',
          },
          {
            title: 'Active Suppliers',
            value: statsData.value.activeSuppliers.value.toString(),
            icon: Users,
            color: 'bg-green-500',
          },
          {
            title: 'Active Batches',
            value: statsData.value.activeBatches.value.toString(),
            icon: Layers,
            color: 'bg-purple-500',
          },
          {
            title: 'Important Alerts',
            value: statsData.value.pendingAlerts.value.toString(),
            icon: AlertTriangle,
            color: 'bg-red-500',
          },
        ])
      }

      // Handle batches data
      if (batchesData.status === 'fulfilled') {
        setRecentBatches(batchesData.value)
      }

      // Handle alerts data (admin only)
      if (alertsData.status === 'fulfilled') {
        setSupplierAlerts(alertsData.value)
      }
      // Handle chart data (admin only)
      if (chartDataRes.status === 'fulfilled') {
        setChartData(chartDataRes.value)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setChartLoading(false)
    }
  }

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your Supply Chain Management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Batches</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentBatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent batches</div>
          ) : (
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div key={batch._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(batch.createdAt).toLocaleDateString()} - {batch.rawMaterial?.name || 'N/A'}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Alerts</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : supplierAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No alerts</div>
          ) : (
            <div className="space-y-4">
              {supplierAlerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
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

      {/* Visual Analytics */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Visual Analytics</h2>
        {chartLoading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="animate-pulse text-gray-400">Loading visual analytics...</div>
          </div>
        ) : (
          <DashboardCharts data={chartData} />
        )}
      </div>
    </div>
  )
}

export default Dashboard

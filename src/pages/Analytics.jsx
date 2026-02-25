import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import DashboardCharts from '../components/dashboard/DashboardCharts'

const Analytics = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [chartData, setChartData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Redirect if not admin
        if (user && user.role !== 'admin') {
            navigate('/batches')
            return
        }

        if (user?.role === 'admin') {
            fetchAnalyticsData()
        }
    }, [user, navigate])

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)
            const data = await dashboardAPI.getChartData()
            setChartData(data)
        } catch (error) {
            console.error('Error fetching analytics data:', error)
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
                <h1 className="text-3xl font-bold text-gray-900">Visual Analytics</h1>
                <p className="mt-2 text-gray-600">Deep dive into your supply chain performance and metrics</p>
            </div>

            {/* Visual Analytics */}
            <div className="mt-8">
                {loading ? (
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

export default Analytics

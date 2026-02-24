import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const DashboardCharts = ({ data }) => {
    if (!data) return null;

    const { supplierStatus, materialStatus, batchApproval, supplierQuality, stockLevels } = data;

    // 1. Supplier Status Data
    const supplierStatusMap = {
        'Approved': 'rgba(34, 197, 94, 0.6)',
        'Pending': 'rgba(234, 179, 8, 0.6)',
        'Suspended': 'rgba(239, 68, 68, 0.6)'
    };
    const supplierStatusBorderMap = {
        'Approved': 'rgb(34, 197, 94)',
        'Pending': 'rgb(234, 179, 8)',
        'Suspended': 'rgb(239, 68, 68)'
    };

    const supplierStatusData = {
        labels: supplierStatus.map(s => s._id),
        datasets: [
            {
                label: 'Suppliers',
                data: supplierStatus.map(s => s.count),
                backgroundColor: supplierStatus.map(s => supplierStatusMap[s._id] || 'rgba(156, 163, 175, 0.6)'),
                borderColor: supplierStatus.map(s => supplierStatusBorderMap[s._id] || 'rgb(156, 163, 175)'),
                borderWidth: 1,
            },
        ],
    };

    // 2. Material Inventory Status Data
    const materialStatusMap = {
        'In Stock': 'rgba(59, 130, 246, 0.6)',
        'Low Stock': 'rgba(249, 115, 22, 0.6)',
        'Out of Stock': 'rgba(239, 68, 68, 0.6)'
    };
    const materialStatusBorderMap = {
        'In Stock': 'rgb(59, 130, 246)',
        'Low Stock': 'rgb(249, 115, 22)',
        'Out of Stock': 'rgb(239, 68, 68)'
    };

    const materialStatusData = {
        labels: materialStatus.map(m => m._id),
        datasets: [
            {
                label: 'Materials',
                data: materialStatus.map(m => m.count),
                backgroundColor: materialStatus.map(m => materialStatusMap[m._id] || 'rgba(156, 163, 175, 0.6)'),
                borderColor: materialStatus.map(m => materialStatusBorderMap[m._id] || 'rgb(156, 163, 175)'),
                borderWidth: 1,
            },
        ],
    };

    // 3. Batch Approval Metrics Data
    const batchApprovalMap = {
        'Approved': 'rgba(34, 197, 94, 0.6)',
        'Pending': 'rgba(234, 179, 8, 0.6)',
        'Rejected': 'rgba(239, 68, 68, 0.6)'
    };
    const batchApprovalBorderMap = {
        'Approved': 'rgb(34, 197, 94)',
        'Pending': 'rgb(234, 179, 8)',
        'Rejected': 'rgb(239, 68, 68)'
    };

    const batchApprovalData = {
        labels: batchApproval.map(b => b._id),
        datasets: [
            {
                label: 'Batches',
                data: batchApproval.map(b => b.count),
                backgroundColor: batchApproval.map(b => batchApprovalMap[b._id] || 'rgba(156, 163, 175, 0.6)'),
                borderColor: batchApproval.map(b => batchApprovalBorderMap[b._id] || 'rgb(156, 163, 175)'),
                borderWidth: 1,
            },
        ],
    };

    // 4. Supplier Quality Issues Data
    const supplierQualityData = {
        labels: supplierQuality.map(s => s.name),
        datasets: [
            {
                label: 'Quality Issues',
                data: supplierQuality.map(s => s.issueCount),
                backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1,
            },
        ],
    };

    // 5. Material Stock Levels Data
    const stockLevelsData = {
        labels: stockLevels.map(m => m.name),
        datasets: [
            {
                label: 'Quantity',
                data: stockLevels.map(m => m.quantity),
                backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Supplier Status Overview */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-80">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Status Overview</h3>
                <div className="h-64">
                    <Pie data={supplierStatusData} options={commonOptions} />
                </div>
            </div>

            {/* Material Inventory Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-80">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Inventory Status</h3>
                <div className="h-64">
                    <Doughnut data={materialStatusData} options={commonOptions} />
                </div>
            </div>

            {/* Batch Approval Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-80">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Approval Overview</h3>
                <div className="h-64">
                    <Bar
                        data={batchApprovalData}
                        options={{
                            ...commonOptions,
                            indexAxis: 'x',
                        }}
                    />
                </div>
            </div>

            {/* Top Suppliers by Quality Issues */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-80 lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Suppliers with Most Quality Issues</h3>
                <div className="h-64">
                    <Bar
                        data={supplierQualityData}
                        options={{
                            ...commonOptions,
                            indexAxis: 'y',
                        }}
                    />
                </div>
            </div>

            {/* Material Stock Levels */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-80 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Raw Materials by Stock Quantity</h3>
                <div className="h-64">
                    <Bar
                        data={stockLevelsData}
                        options={{
                            ...commonOptions,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;

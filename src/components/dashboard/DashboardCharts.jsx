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
        'Approved': 'rgba(52, 211, 153, 0.9)', // Deeper Emerald
        'Pending': 'rgba(251, 191, 36, 0.9)',  // Deeper Amber
        'Suspended': 'rgba(251, 113, 133, 0.9)' // Deeper Rose
    };
    const supplierStatusBorderMap = {
        'Approved': 'rgb(16, 185, 129)',
        'Pending': 'rgb(245, 158, 11)',
        'Suspended': 'rgb(244, 63, 94)'
    };

    const supplierStatusData = {
        labels: supplierStatus.map(s => s._id),
        datasets: [
            {
                label: 'Suppliers',
                data: supplierStatus.map(s => s.count),
                items: supplierStatus.map(s => s.items),
                backgroundColor: supplierStatus.map(s => supplierStatusMap[s._id] || 'rgba(107, 114, 128, 0.85)'),
                borderColor: supplierStatus.map(s => supplierStatusBorderMap[s._id] || 'rgb(75, 85, 99)'),
                borderWidth: 0,
                hoverOffset: 4
            },
        ],
    };

    // 2. Material Inventory Status Data
    const materialStatusMap = {
        'In Stock': 'rgba(56, 189, 248, 0.9)',   // Deeper Sky
        'Low Stock': 'rgba(251, 191, 36, 0.9)',  // Deeper Amber
        'Out of Stock': 'rgba(251, 113, 133, 0.9)'// Deeper Rose
    };
    const materialStatusBorderMap = {
        'In Stock': 'rgb(14, 165, 233)',
        'Low Stock': 'rgb(245, 158, 11)',
        'Out of Stock': 'rgb(244, 63, 94)'
    };

    const materialStatusData = {
        labels: materialStatus.map(m => m._id),
        datasets: [
            {
                label: 'Materials',
                data: materialStatus.map(m => m.count),
                items: materialStatus.map(m => m.items),
                backgroundColor: materialStatus.map(m => materialStatusMap[m._id] || 'rgba(107, 114, 128, 0.85)'),
                borderColor: materialStatus.map(m => materialStatusBorderMap[m._id] || 'rgb(75, 85, 99)'),
                borderWidth: 0,
                cutout: '70%',
            },
        ],
    };

    // 3. Batch Approval Metrics Data
    const batchApprovalMap = {
        'Approved': 'rgba(52, 211, 153, 0.9)',
        'Pending': 'rgba(251, 191, 36, 0.9)',
        'Rejected': 'rgba(251, 113, 133, 0.9)'
    };
    const batchApprovalBorderMap = {
        'Approved': 'rgb(16, 185, 129)',
        'Pending': 'rgb(245, 158, 11)',
        'Rejected': 'rgb(244, 63, 94)'
    };

    const batchApprovalData = {
        labels: batchApproval.map(b => b._id),
        datasets: [
            {
                label: 'Batches',
                data: batchApproval.map(b => b.count),
                items: batchApproval.map(b => b.items),
                backgroundColor: batchApproval.map(b => batchApprovalMap[b._id] || 'rgba(107, 114, 128, 0.85)'),
                borderColor: batchApproval.map(b => batchApprovalBorderMap[b._id] || 'rgb(75, 85, 99)'),
                borderWidth: 0,
                borderRadius: 4,
                barPercentage: 0.6,
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
                items: supplierQuality.map(s => s.items),
                backgroundColor: 'rgba(167, 139, 250, 0.9)', // Deeper Violet
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 0,
                borderRadius: 4,
                barPercentage: 0.7,
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
                suppliers: stockLevels.map(m => m.supplier),
                backgroundColor: 'rgba(56, 189, 248, 0.9)', // Deeper Sky Blue
                borderColor: 'rgb(14, 165, 233)',
                borderWidth: 0,
                borderRadius: 4,
                barPercentage: 0.6,
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 13
                },
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        let value;
                        if (typeof context.parsed === 'number') {
                            value = context.parsed;
                        } else {
                            // Handle both vertical (y) and horizontal (x) bar charts
                            value = context.parsed.y !== undefined ? context.parsed.y : context.parsed.x;
                        }
                        label += value;
                        return label;
                    },
                    footer: function(tooltipItems) {
                        const context = tooltipItems[0];
                        const dataset = context.dataset;
                        const index = context.dataIndex;
                        
                        if (dataset.items) {
                            const items = dataset.items[index];
                            if (items && items.length > 0) {
                                const displayItems = items.slice(0, 10); // Increased limit slightly for vertical list
                                const lines = ['Details:'];
                                displayItems.forEach(item => lines.push(`• ${item}`));
                                if (items.length > 10) {
                                    lines.push(`...and ${items.length - 10} more`);
                                }
                                return lines;
                            }
                        }
                        
                        if (dataset.suppliers) {
                            return [`Supplier:`, `• ${dataset.suppliers[index]}`];
                        }
                        
                        return '';
                    }
                },
                footerFont: {
                    family: "'Inter', sans-serif",
                    size: 12,
                    weight: 'normal'
                },
                footerColor: '#6B7280',
                footerMarginTop: 8,
            },
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: '500' // Corrected valid type handling for Chart.js
                    },
                    color: '#4B5563'
                }
            },
        },
    };

    const barScales = {
        x: {
            grid: { display: false },
            ticks: {
                font: { family: "'Inter', sans-serif", size: 12 },
                color: '#6B7280'
            }
        },
        y: {
            grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false },
            ticks: {
                font: { family: "'Inter', sans-serif", size: 12 },
                color: '#6B7280',
                precision: 0
            }
        }
    };

    const horizontalBarScales = {
        x: {
            grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false },
            ticks: {
                font: { family: "'Inter', sans-serif", size: 12 },
                color: '#6B7280',
                precision: 0
            }
        },
        y: {
            grid: { display: false },
            ticks: {
                font: { family: "'Inter', sans-serif", size: 12 },
                color: '#6B7280'
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Supplier Status Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Supplier Status Overview</h3>
                <div className="h-64">
                    <Pie data={supplierStatusData} options={commonOptions} />
                </div>
            </div>

            {/* Material Inventory Status */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Material Inventory Status</h3>
                <div className="h-64">
                    <Doughnut data={materialStatusData} options={commonOptions} />
                </div>
            </div>

            {/* Batch Approval Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Batch Approval Overview</h3>
                <div className="h-64">
                    <Bar
                        data={batchApprovalData}
                        options={{
                            ...commonOptions,
                            indexAxis: 'x',
                            scales: barScales
                        }}
                    />
                </div>
            </div>

            {/* Top Suppliers by Quality Issues */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80 lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Suppliers with Most Quality Issues</h3>
                <div className="h-64">
                    <Bar
                        data={supplierQualityData}
                        options={{
                            ...commonOptions,
                            indexAxis: 'y',
                            scales: horizontalBarScales
                        }}
                    />
                </div>
            </div>

            {/* Material Stock Levels */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Top 5 Raw Materials by Stock Quantity</h3>
                <div className="h-64">
                    <Bar
                        data={stockLevelsData}
                        options={{
                            ...commonOptions,
                            indexAxis: 'x',
                            plugins: {
                                ...commonOptions.plugins,
                                tooltip: {
                                    ...commonOptions.plugins.tooltip,
                                    callbacks: {
                                        ...commonOptions.plugins.tooltip.callbacks,
                                        label: function(context) {
                                            return ` Stock Quantity: ${context.parsed.y} kg`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: barScales.x,
                                y: {
                                    ...barScales.y,
                                    beginAtZero: true,
                                    ticks: {
                                        ...barScales.y.ticks,
                                        callback: function(value) {
                                            return value + ' kg';
                                        }
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;

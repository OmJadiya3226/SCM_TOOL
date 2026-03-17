import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Users,
    Package,
    Layers,
    ArrowRight,
    ExternalLink,
    X,
    ChevronRight,
    SearchCode,
    GitBranch,
    Info,
    MapPin
} from 'lucide-react';
import { suppliersAPI, rawMaterialsAPI, batchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';

// Error Boundary for specialized error detection
class SCMSearchErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("SCMSearch Error Captured:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
                    <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
                    <p className="text-red-700 mb-4">{this.state.error?.message || "An unexpected error occurred."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const SCMSearch = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState({
        suppliers: [],
        rawMaterials: [],
        batches: []
    });

    // View Modal States
    const [viewingSupplier, setViewingSupplier] = useState(null);
    const [viewingMaterial, setViewingMaterial] = useState(null);
    const [viewingBatch, setViewingBatch] = useState(null);
    const [showingMap, setShowingMap] = useState(false);

    const formatQuantity = (q, u) => {
        try {
            if (q === null || q === undefined) return 'N/A';
            if (typeof q === 'object') {
                if ('value' in q) {
                    return `${q.value ?? 0} ${q.unit || (typeof u === 'string' ? u : '') || ''}`;
                }
                return JSON.stringify(q);
            }
            return `${q} ${(typeof u === 'string' ? u : '') || ''}`;
        } catch (e) {
            console.error("formatQuantity crashed:", e, q, u);
            return "Error";
        }
    };

    const safeRender = (val, fallback = 'N/A') => {
        if (val === null || val === undefined) return fallback;
        if (typeof val === 'object') {
            return JSON.stringify(val);
        }
        return val;
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [suppliers, materials, batches] = await Promise.all([
                    suppliersAPI.getAll(),
                    rawMaterialsAPI.getAll(),
                    batchesAPI.getAll()
                ]);
                setData({
                    suppliers: (Array.isArray(suppliers) ? suppliers : []).filter(Boolean),
                    rawMaterials: (Array.isArray(materials) ? materials : []).filter(Boolean),
                    batches: (Array.isArray(batches) ? batches : []).filter(Boolean)
                });
            } catch (error) {
                console.error('Error fetching search data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'suppliers', 'materials', 'batches'

    const results = useMemo(() => {
        if (!searchTerm.trim()) return { suppliers: [], rawMaterials: [], batches: [] };

        const query = searchTerm.toLowerCase();
        const res = {
            suppliers: data.suppliers.filter(s =>
                s && (
                    (s.name?.toLowerCase() || '').includes(query) ||
                    (s.contactEmail?.toLowerCase() || '').includes(query)
                )
            ),
            rawMaterials: data.rawMaterials.filter(m =>
                m && (
                    (m.name?.toLowerCase() || '').includes(query) ||
                    (m.code?.toLowerCase() || '').includes(query) ||
                    (m.lotNumber?.toLowerCase() || '').includes(query)
                )
            ),
            batches: data.batches.filter(b =>
                b && (
                    (b.batchNumber?.toLowerCase() || '').includes(query) ||
                    (b.notes?.toLowerCase() || '').includes(query) ||
                    (b.buyer?.toLowerCase() || '').includes(query)
                )
            )
        };

        if (activeFilter === 'suppliers') return { ...res, rawMaterials: [], batches: [] };
        if (activeFilter === 'materials') return { ...res, suppliers: [], batches: [] };
        if (activeFilter === 'batches') return { ...res, suppliers: [], rawMaterials: [] };
        return res;
    }, [searchTerm, data, activeFilter]);

    const hasResults = results.suppliers.length > 0 || results.rawMaterials.length > 0 || results.batches.length > 0;

    // Modal Handle Functions
    const handleViewSupplier = async (id) => {
        try {
            const supplier = await suppliersAPI.getById(id);
            setViewingSupplier(supplier);
        } catch (error) {
            console.error('Error fetching supplier:', error);
            alert('Failed to load supplier details');
        }
    };

    const handleViewMaterial = async (id) => {
        try {
            const material = await rawMaterialsAPI.getById(id);
            setViewingMaterial(material);
        } catch (error) {
            console.error('Error fetching raw material:', error);
            alert('Failed to load raw material details');
        }
    };

    const handleViewBatch = async (id) => {
        try {
            const batch = await batchesAPI.getById(id);
            setViewingBatch(batch);
        } catch (error) {
            console.error('Error fetching batch:', error);
            alert('Failed to load batch details');
        }
    };

    if (user?.role === 'qa-worker') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <SearchCode className="w-8 h-8 text-primary-600" />
                    SCM Search
                </h1>
                <p className="mt-2 text-gray-600">Search for suppliers, raw materials and batches</p>
            </div>

            <div className="space-y-6">
                {/* Search Bar & Filters */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for suppliers, raw materials and batches"
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm text-lg outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 px-2">
                        {[
                            { id: 'all', label: 'All Results', icon: SearchCode },
                            { id: 'suppliers', label: 'Suppliers', icon: Users },
                            { id: 'materials', label: 'Raw Materials', icon: Package },
                            { id: 'batches', label: 'Batches', icon: Layers }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === f.id
                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                    }`}
                            >
                                <f.icon className="w-4 h-4" />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Area */}
                <div className="space-y-8 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
                            <p className="text-gray-500 font-medium">Loading SCM...</p>
                        </div>
                    ) : !searchTerm.trim() ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <Search className="w-12 h-12 text-gray-300" />
                            <div>
                                <p className="text-gray-900 font-bold text-lg">Global Search</p>
                                <p className="text-gray-500 max-w-md">Search for suppliers, raw materials and batches</p>
                            </div>
                        </div>
                    ) : !hasResults ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-red-50 rounded-2xl border border-red-100">
                            <Info className="w-12 h-12 text-red-300" />
                            <div>
                                <p className="text-red-900 font-bold text-lg">No matches found</p>
                                <p className="text-red-600">Try changing your search term or filters</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Suppliers Results */}
                            {results.suppliers.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 text-blue-600 px-2">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-widest font-bold">Related Suppliers ({results.suppliers.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {results.suppliers.map(s => (
                                            <button
                                                key={s._id}
                                                onClick={() => handleViewSupplier(s._id)}
                                                className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-left transition-all hover:shadow-md hover:border-blue-300 group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{safeRender(s.name)}</p>
                                                    <ExternalLink className="w-4 h-4 text-blue-300 group-hover:text-blue-500 transition-colors shrink-0 ml-2" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Materials Results */}
                            {results.rawMaterials.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 text-orange-600 px-2">
                                        <Package className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-widest font-bold">Raw Materials ({results.rawMaterials.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {results.rawMaterials.map(m => (
                                            <button
                                                key={m._id}
                                                onClick={() => handleViewMaterial(m._id)}
                                                className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-left transition-all hover:shadow-md hover:border-orange-300 group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors">{safeRender(m.name)}</p>
                                                    <ExternalLink className="w-4 h-4 text-orange-300 group-hover:text-orange-500 transition-colors shrink-0 ml-2" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Batches Results */}
                            {results.batches.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 text-purple-600 px-2">
                                        <Layers className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-widest font-bold">Production Batches ({results.batches.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {results.batches.map(b => (
                                            <button
                                                key={b._id}
                                                onClick={() => handleViewBatch(b._id)}
                                                className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-left transition-all hover:shadow-md hover:border-purple-300 group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{safeRender(b.batchNumber, 'Unknown Batch')}</p>
                                                    <ExternalLink className="w-4 h-4 text-purple-300 group-hover:text-purple-500 transition-colors shrink-0 ml-2" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* View Supplier Modal */}
            {showingMap && viewingSupplier && (
                <Modal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[110] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Supplier Location</h2>
                                <button
                                    onClick={() => setShowingMap(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1 w-full bg-gray-100 p-2 relative">
                                <iframe
                                    title="Google Maps"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, borderRadius: '0.5rem' }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent([viewingSupplier.address.street, viewingSupplier.address.city, viewingSupplier.address.state, viewingSupplier.address.zipCode, viewingSupplier.address.country].join(', '))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {viewingSupplier && (
                <Modal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Supplier Details</h2>
                                <button
                                    onClick={() => setViewingSupplier(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <p className="mt-1 text-gray-900">{viewingSupplier.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${viewingSupplier.status === 'Approved'
                                        ? 'bg-green-100 text-green-800'
                                        : viewingSupplier.status === 'Pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {viewingSupplier.status}
                                    </span>
                                </div>
                                {viewingSupplier.certifications && viewingSupplier.certifications.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Certifications</label>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {viewingSupplier.certifications.map((cert, idx) => {
                                                const certName = typeof cert === 'string' ? cert : cert.name
                                                const certExpiry = typeof cert === 'object' ? cert.expiryDate : null
                                                const fileUrl = typeof cert === 'object' ? cert.fileUrl : null
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="px-3 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-center gap-3"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{certName}</span>
                                                            {certExpiry && (
                                                                <span className="text-xs text-blue-600">
                                                                    Expires: {new Date(certExpiry).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {fileUrl && (
                                                            <a
                                                                href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                                PDF
                                                            </a>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                                {viewingSupplier.contactEmail && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                        <p className="mt-1 text-gray-900">{viewingSupplier.contactEmail}</p>
                                    </div>
                                )}
                                {viewingSupplier.contactPhone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                                        <p className="mt-1 text-gray-900">{viewingSupplier.contactPhone}</p>
                                    </div>
                                )}
                                {viewingSupplier.address && (viewingSupplier.address.street || viewingSupplier.address.city) && (
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-medium text-gray-700">Address</label>
                                            {viewingSupplier.address.street && viewingSupplier.address.city && viewingSupplier.address.state && viewingSupplier.address.zipCode && viewingSupplier.address.country && (
                                                <button
                                                    onClick={() => setShowingMap(true)}
                                                    className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    Show on Map
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-1 text-gray-900">
                                            {[viewingSupplier.address.street, viewingSupplier.address.city, viewingSupplier.address.state, viewingSupplier.address.zipCode, viewingSupplier.address.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                )}
                                {viewingSupplier.qualityIssues && viewingSupplier.qualityIssues.length > 0 ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quality Issues</label>
                                        <div className="mt-1 space-y-2">
                                            {viewingSupplier.qualityIssues.map((issue, idx) => (
                                                <div key={idx} className="p-3 bg-red-50 rounded-lg">
                                                    <p className="text-red-900 font-medium">{issue.description}</p>
                                                    <p className="text-xs text-red-700 mt-1">
                                                        Reported: {new Date(issue.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quality Issues</label>
                                        <p className="mt-1 text-green-600">No quality issues reported</p>
                                    </div>
                                )}
                                {viewingSupplier.lastAudit && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Audit</label>
                                        <p className="mt-1 text-gray-900">{new Date(viewingSupplier.lastAudit).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {viewingSupplier.notes && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                                        <p className="mt-1 text-gray-900">{viewingSupplier.notes}</p>
                                    </div>
                                )}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setViewingSupplier(null)}
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* View Raw Material Modal */}
            {viewingMaterial && (
                <Modal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Raw Material Details</h2>
                                <button
                                    onClick={() => setViewingMaterial(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <p className="mt-1 text-gray-900">{viewingMaterial.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Purity</label>
                                        <p className="mt-1 text-gray-900">{viewingMaterial.purity}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Hazard Class</label>
                                        <span className="mt-1 inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                            {viewingMaterial.hazardClass}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                                    <p className="mt-1 text-gray-900">
                                        {typeof viewingMaterial.supplier === 'object' && viewingMaterial.supplier
                                            ? viewingMaterial.supplier.name
                                            : viewingMaterial.supplier || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Storage Temperature</label>
                                    <p className="mt-1 text-gray-900">{viewingMaterial.storageTemp}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                        <p className="mt-1 text-gray-900">
                                            {formatQuantity(viewingMaterial.quantity)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${viewingMaterial.status === 'In Stock'
                                            ? 'bg-green-100 text-green-800'
                                            : viewingMaterial.status === 'Low Stock'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {viewingMaterial.status}
                                        </span>
                                    </div>
                                </div>
                                {viewingMaterial.expiryDate && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                        <p className="mt-1 text-gray-900">{new Date(viewingMaterial.expiryDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {viewingMaterial.lotNumber && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                                        <p className="mt-1 text-gray-900">{viewingMaterial.lotNumber}</p>
                                    </div>
                                )}
                                {viewingMaterial.description && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <p className="mt-1 text-gray-900">{viewingMaterial.description}</p>
                                    </div>
                                )}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setViewingMaterial(null)}
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* View Batch Modal */}
            {viewingBatch && (
                <Modal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Batch Details</h2>
                                <button
                                    onClick={() => setViewingBatch(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                                    <p className="mt-1 text-gray-900">{viewingBatch.batchNumber}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Raw Materials</label>
                                        <ul className="mt-1 list-disc list-inside text-gray-900">
                                            {Array.isArray(viewingBatch.rawMaterial) ? (
                                                viewingBatch.rawMaterial.map((rm, idx) => (
                                                    <li key={idx}>{typeof rm === 'object' ? rm.name : rm}</li>
                                                ))
                                            ) : (
                                                <li>{typeof viewingBatch.rawMaterial === 'object' ? viewingBatch.rawMaterial.name : viewingBatch.rawMaterial}</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Source Suppliers</label>
                                        <ul className="mt-1 list-disc list-inside text-gray-900">
                                            {Array.isArray(viewingBatch.source) ? (
                                                viewingBatch.source.map((s, idx) => (
                                                    <li key={idx}>{typeof s === 'object' ? s.name : s}</li>
                                                ))
                                            ) : (
                                                <li>{typeof viewingBatch.source === 'object' ? viewingBatch.source.name : viewingBatch.source}</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Production Date</label>
                                        <p className="mt-1 text-gray-900">{new Date(viewingBatch.productionDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Acquisition Date</label>
                                        <p className="mt-1 text-gray-900">{new Date(viewingBatch.acquisitionDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Buyer</label>
                                    <p className="mt-1 text-gray-900">{viewingBatch.buyer}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contents</label>
                                    <p className="mt-1 text-gray-900">{viewingBatch.contents}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                        <p className="mt-1 text-gray-900">
                                            {formatQuantity(viewingBatch.quantity)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                                            ${viewingBatch.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                viewingBatch.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {viewingBatch.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                                            ${viewingBatch.approvalStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                                                viewingBatch.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {viewingBatch.approvalStatus || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                {viewingBatch.notes && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                                        <p className="mt-1 text-gray-900">{viewingBatch.notes}</p>
                                    </div>
                                )}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setViewingBatch(null)}
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const SCMSearchWrapped = () => (
    <SCMSearchErrorBoundary>
        <SCMSearch />
    </SCMSearchErrorBoundary>
);

export default SCMSearchWrapped;


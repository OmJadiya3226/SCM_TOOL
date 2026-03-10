import React, { useState, useEffect, useMemo } from 'react'
import {
    GitBranch,
    Users,
    Package,
    Layers,
    ArrowRight,
    Search,
    Info,
    ChevronRight,
    ExternalLink,
    X
} from 'lucide-react'
import { suppliersAPI, rawMaterialsAPI, batchesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'

const SCMOverview = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        suppliers: [],
        rawMaterials: [],
        batches: []
    })

    const [selectedType, setSelectedType] = useState('supplier') // 'supplier', 'rawMaterial', 'batch'
    const [selectedId, setSelectedId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    // Viewing Modals State
    const [viewingSupplier, setViewingSupplier] = useState(null)
    const [viewingMaterial, setViewingMaterial] = useState(null)
    const [viewingBatch, setViewingBatch] = useState(null)

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true)
                const [suppliers, rawMaterials, batches] = await Promise.all([
                    suppliersAPI.getAll(),
                    rawMaterialsAPI.getAll(),
                    batchesAPI.getAll()
                ])

                setData({
                    suppliers: Array.isArray(suppliers) ? suppliers : [],
                    rawMaterials: Array.isArray(rawMaterials) ? rawMaterials : [],
                    batches: Array.isArray(batches) ? batches : []
                })

                // Set initial selection (Suppliers first as per request)
                if (Array.isArray(suppliers) && suppliers.length > 0) {
                    setSelectedId(suppliers[0]._id)
                } else if (Array.isArray(batches) && batches.length > 0) {
                    setSelectedType('batch')
                    setSelectedId(batches[0]._id)
                }
            } catch (error) {
                console.error('Error fetching SCM data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAllData()
    }, [])

    const filteredItems = useMemo(() => {
        const source = selectedType === 'supplier' ? data.suppliers :
            selectedType === 'rawMaterial' ? data.rawMaterials :
                data.batches

        const items = source.filter(item => {
            const name = item.name || item.batchNumber || ''
            return name.toLowerCase().includes(searchTerm.toLowerCase())
        })

        // If no search term, show top 5
        if (!searchTerm.trim()) {
            return items.slice(0, 5)
        }

        return items
    }, [selectedType, data, searchTerm])

    const selectedItem = useMemo(() => {
        const source = selectedType === 'supplier' ? data.suppliers :
            selectedType === 'rawMaterial' ? data.rawMaterials :
                data.batches
        return source.find(item => item._id === selectedId)
    }, [selectedId, selectedType, data])

    // Relationship Graph Calculation
    const graph = useMemo(() => {
        if (!selectedItem) return null

        let linkedSuppliers = []
        let linkedMaterials = []
        let linkedBatches = []

        if (selectedType === 'supplier') {
            linkedSuppliers = [selectedItem]
            linkedMaterials = data.rawMaterials.filter(rm => {
                const supId = typeof rm.supplier === 'object' ? rm.supplier._id : rm.supplier
                return supId === selectedItem._id
            })
            const materialIds = linkedMaterials.map(m => m._id)
            linkedBatches = data.batches.filter(b => {
                const batchMatIds = Array.isArray(b.rawMaterial)
                    ? b.rawMaterial.map(rm => (typeof rm === 'object' ? rm._id : rm))
                    : [typeof b.rawMaterial === 'object' ? b.rawMaterial?._id : b.rawMaterial].filter(Boolean)
                return batchMatIds.some(id => materialIds.includes(id))
            })
        } else if (selectedType === 'rawMaterial') {
            const supId = typeof selectedItem.supplier === 'object' ? selectedItem.supplier._id : selectedItem.supplier
            linkedSuppliers = data.suppliers.filter(s => s._id === supId)
            linkedMaterials = [selectedItem]
            linkedBatches = data.batches.filter(b => {
                const batchMatIds = Array.isArray(b.rawMaterial)
                    ? b.rawMaterial.map(rm => (typeof rm === 'object' ? rm._id : rm))
                    : [typeof b.rawMaterial === 'object' ? b.rawMaterial?._id : b.rawMaterial].filter(Boolean)
                return batchMatIds.includes(selectedItem._id)
            })
        } else if (selectedType === 'batch') {
            const batchMatIds = Array.isArray(selectedItem.rawMaterial)
                ? selectedItem.rawMaterial.map(rm => (typeof rm === 'object' ? rm._id : rm))
                : [typeof selectedItem.rawMaterial === 'object' ? selectedItem.rawMaterial?._id : selectedItem.rawMaterial].filter(Boolean)

            const batchSupIds = Array.isArray(selectedItem.source)
                ? selectedItem.source.map(s => (typeof s === 'object' ? s._id : s))
                : [typeof selectedItem.source === 'object' ? selectedItem.source?._id : selectedItem.source].filter(Boolean)

            linkedMaterials = data.rawMaterials.filter(rm => batchMatIds.includes(rm._id))
            linkedSuppliers = data.suppliers.filter(s => batchSupIds.includes(s._id))
            linkedBatches = [selectedItem]
        }

        return { linkedSuppliers, linkedMaterials, linkedBatches }
    }, [selectedItem, selectedType, data])

    const handleNodeClick = async (type, id) => {
        try {
            if (type === 'supplier') {
                const supplier = await suppliersAPI.getById(id)
                setViewingSupplier(supplier)
            } else if (type === 'rawMaterial') {
                const material = await rawMaterialsAPI.getById(id)
                setViewingMaterial(material)
            } else if (type === 'batch') {
                const batch = await batchesAPI.getById(id)
                setViewingBatch(batch)
            }
        } catch (error) {
            console.error(`Error fetching ${type} details:`, error)
            alert(`Failed to load ${type} details`)
        }
    }

    if (user?.role === 'qa-worker') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <GitBranch className="w-8 h-8 text-primary-600" />
                        SCM Overview
                    </h1>
                    <p className="mt-2 text-gray-600">Visualize the entire supply chain connections between entities.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Selection Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:col-span-1 h-fit">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Root Entity</label>
                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                {[
                                    { id: 'supplier', icon: Users, label: 'Supplier' },
                                    { id: 'rawMaterial', icon: Package, label: 'Material' },
                                    { id: 'batch', icon: Layers, label: 'Batch' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            setSelectedType(type.id)
                                            setSelectedId('')
                                            setSearchTerm('')
                                        }}
                                        className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md transition-all ${selectedType === type.id
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <type.icon className="w-4 h-4 mb-1" />
                                        <span className="text-[10px] font-medium">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${selectedType === 'rawMaterial' ? 'material' : selectedType}s...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredItems.length === 0 ? (
                                <p className="text-center py-4 text-xs text-gray-400">No items found</p>
                            ) : (
                                filteredItems.map(item => (
                                    <button
                                        key={item._id}
                                        onClick={() => setSelectedId(item._id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedId === item._id
                                            ? 'bg-primary-50 text-primary-700 font-medium border border-primary-100'
                                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <span className="truncate">{item.name || item.batchNumber}</span>
                                        <ChevronRight className={`w-3 h-3 transition-transform ${selectedId === item._id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Visual Graph Panel */}
                <div className="lg:col-span-3 min-h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    {!selectedItem ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <GitBranch className="w-16 h-16 stroke-1 italic" />
                            <p>Select an item from the left to visualize its supply chain.</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col p-6">
                            {/* Header Info */}
                            <div className="mb-10 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${selectedType === 'supplier' ? 'bg-blue-100 text-blue-700' :
                                            selectedType === 'rawMaterial' ? 'bg-orange-100 text-orange-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            Root {selectedType === 'rawMaterial' ? 'Material' : selectedType}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name || selectedItem.batchNumber}</h2>
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Showing all associated supply chain entities
                                    </p>
                                </div>
                            </div>

                            {/* Graph Area */}
                            <div className="flex-1 flex items-stretch justify-between gap-4 relative">
                                {/* Column 1: Suppliers */}
                                <div className="flex-1 flex flex-col pt-10 pb-10 space-y-4 z-10">
                                    <div className="text-center mb-6">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Users className="w-3 h-3" /> Suppliers
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-6 flex-1">
                                        {graph.linkedSuppliers.map(s => (
                                            <NodeCard
                                                key={s._id}
                                                title={s.name}
                                                subtitle={s.location || 'Global Supplier'}
                                                icon={Users}
                                                color="blue"
                                                isRoot={selectedType === 'supplier' && selectedId === s._id}
                                                onClick={() => handleNodeClick('supplier', s._id)}
                                            />
                                        ))}
                                        {graph.linkedSuppliers.length === 0 && <EmptyNode label="No linked suppliers" />}
                                    </div>
                                </div>

                                {/* Connection Space 1 */}
                                <div className="w-16 flex flex-col pt-10 pb-10 opacity-30">
                                    <div className="invisible mb-6 h-4"></div> {/* Spacer to match headers */}
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-full h-[1px] bg-gradient-to-r from-blue-500 to-orange-500 relative">
                                            <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Raw Materials */}
                                <div className="flex-1 flex flex-col pt-10 pb-10 space-y-4 z-10">
                                    <div className="text-center mb-6">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Package className="w-3 h-3" /> Raw Materials
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-6 flex-1">
                                        {graph.linkedMaterials.map(rm => (
                                            <NodeCard
                                                key={rm._id}
                                                title={rm.name}
                                                subtitle={`Purity: ${rm.purity}`}
                                                icon={Package}
                                                color="orange"
                                                isRoot={selectedType === 'rawMaterial' && selectedId === rm._id}
                                                onClick={() => handleNodeClick('rawMaterial', rm._id)}
                                            />
                                        ))}
                                        {graph.linkedMaterials.length === 0 && <EmptyNode label="No linked materials" />}
                                    </div>
                                </div>

                                {/* Connection Space 2 */}
                                <div className="w-16 flex flex-col pt-10 pb-10 opacity-30">
                                    <div className="invisible mb-6 h-4"></div> {/* Spacer to match headers */}
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-full h-[1px] bg-gradient-to-r from-orange-500 to-purple-500 relative">
                                            <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Batches */}
                                <div className="flex-1 flex flex-col pt-10 pb-10 space-y-4 z-10">
                                    <div className="text-center mb-6">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Layers className="w-3 h-3" /> Produced Batches
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-6 flex-1">
                                        {graph.linkedBatches.map(b => (
                                            <NodeCard
                                                key={b._id}
                                                title={b.batchNumber}
                                                subtitle={`Status: ${b.status}`}
                                                icon={Layers}
                                                color="purple"
                                                isRoot={selectedType === 'batch' && selectedId === b._id}
                                                onClick={() => handleNodeClick('batch', b._id)}
                                            />
                                        ))}
                                        {graph.linkedBatches.length === 0 && <EmptyNode label="No linked batches" />}
                                    </div>
                                </div>

                                {/* Connecting SVG Lines (Background) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-10">
                                    {/* Simplified connections */}
                                </svg>
                            </div>

                            {/* Legend/Helper */}
                            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-8">
                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> SUPPLIER ENTITY
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> MATERIAL ASSET
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> PRODUCTION BATCH
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Supplier Modal */}
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
                            <div className="p-6 space-y-4">
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
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
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
                            <div className="p-6 space-y-4">
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
                                            {viewingMaterial.quantity?.value} {viewingMaterial.quantity?.unit}
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
                            <div className="p-6 space-y-4">
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
                                            {viewingBatch.quantity?.value} {viewingBatch.quantity?.unit}
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
    )
}

const NodeCard = ({ title, subtitle, icon: Icon, color, isRoot, onClick }) => {
    const colorClasses = {
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        purple: 'border-purple-200 bg-purple-50 text-purple-700'
    }

    const rootClasses = isRoot
        ? 'ring-2 ring-offset-4 ring-primary-500 scale-105 shadow-xl'
        : 'hover:shadow-md hover:-translate-y-1'

    return (
        <div
            onClick={onClick}
            className={`w-48 p-3 rounded-xl border transition-all duration-300 relative group bg-white cursor-pointer ${colorClasses[color]} ${rootClasses}`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isRoot ? 'bg-primary-600 text-white' : 'bg-white shadow-sm border border-inherit'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-gray-900">{title}</h4>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5 uppercase tracking-tight font-medium">{subtitle}</p>
                </div>
            </div>
            {isRoot && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                </div>
            )}
        </div>
    )
}

const EmptyNode = ({ label }) => (
    <div className="w-48 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter italic">{label}</p>
    </div>
)

export default SCMOverview

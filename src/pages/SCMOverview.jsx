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
    ExternalLink
} from 'lucide-react'
import { suppliersAPI, rawMaterialsAPI, batchesAPI } from '../services/api'

const SCMOverview = () => {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        suppliers: [],
        rawMaterials: [],
        batches: []
    })

    const [selectedType, setSelectedType] = useState('supplier') // 'supplier', 'rawMaterial', 'batch'
    const [selectedId, setSelectedId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

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
        </div>
    )
}

const NodeCard = ({ title, subtitle, icon: Icon, color, isRoot }) => {
    const colorClasses = {
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        purple: 'border-purple-200 bg-purple-50 text-purple-700'
    }

    const rootClasses = isRoot
        ? 'ring-2 ring-offset-4 ring-primary-500 scale-105 shadow-xl'
        : 'hover:shadow-md hover:-translate-y-1'

    return (
        <div className={`w-48 p-3 rounded-xl border transition-all duration-300 relative group bg-white ${colorClasses[color]} ${rootClasses}`}>
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

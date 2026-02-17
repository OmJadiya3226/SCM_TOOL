import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { batchesAPI, suppliersAPI, rawMaterialsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'

const Batches = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [formData, setFormData] = useState({
    batchNumber: '',
    rawMaterial: '',
    source: '',
    productionDate: '',
    acquisitionDate: '',
    buyer: '',
    contents: '',
    status: 'Active',
    quantity: {
      value: '',
      unit: 'kg',
    },
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [viewingBatch, setViewingBatch] = useState(null)
  const [editingBatch, setEditingBatch] = useState(null)

  useEffect(() => {
    fetchBatches()
    if (isOverlayOpen || isFilterOpen) {
      fetchSuppliers()
      fetchRawMaterials()
    }
  }, [searchTerm, statusFilter, sourceFilter, buyerFilter, isOverlayOpen, isFilterOpen])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter
      if (sourceFilter) params.source = sourceFilter
      if (buyerFilter) params.buyer = buyerFilter

      const data = await batchesAPI.getAll(params)
      setBatches(data)
    } catch (error) {
      console.error('Error fetching batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersAPI.getAll()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchRawMaterials = async () => {
    try {
      const data = await rawMaterialsAPI.getAll()
      setRawMaterials(data)
    } catch (error) {
      console.error('Error fetching raw materials:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const submitData = {
        ...formData,
        quantity: {
          value: parseFloat(formData.quantity.value),
          unit: formData.quantity.unit,
        },
        notes: formData.notes || undefined,
      }
      await batchesAPI.create(submitData)
      setIsOverlayOpen(false)
      setFormData({
        batchNumber: '',
        rawMaterial: '',
        source: '',
        productionDate: '',
        acquisitionDate: '',
        buyer: '',
        contents: '',
        status: 'Active',
        quantity: {
          value: '',
          unit: 'kg',
        },
        notes: '',
      })
      fetchBatches()
    } catch (error) {
      console.error('Error creating batch:', error)
      alert(error.message || 'Failed to create batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false)
    setEditingBatch(null)
    setFormData({
      batchNumber: '',
      rawMaterial: '',
      source: '',
      productionDate: '',
      acquisitionDate: '',
      buyer: '',
      contents: '',
      status: 'Active',
      quantity: {
        value: '',
        unit: 'kg',
      },
      notes: '',
    })
  }

  const handleView = async (batchId) => {
    try {
      const batch = await batchesAPI.getById(batchId)
      setViewingBatch(batch)
    } catch (error) {
      console.error('Error fetching batch:', error)
      alert('Failed to load batch details')
    }
  }

  const handleEdit = async (batchId) => {
    try {
      const batch = await batchesAPI.getById(batchId)
      setEditingBatch(batch)
      setFormData({
        batchNumber: batch.batchNumber || '',
        rawMaterial: (typeof batch.rawMaterial === 'object' && batch.rawMaterial)
          ? batch.rawMaterial._id
          : batch.rawMaterial || '',
        source: (typeof batch.source === 'object' && batch.source)
          ? batch.source._id
          : batch.source || '',
        productionDate: batch.productionDate ? new Date(batch.productionDate).toISOString().split('T')[0] : '',
        acquisitionDate: batch.acquisitionDate ? new Date(batch.acquisitionDate).toISOString().split('T')[0] : '',
        buyer: batch.buyer || '',
        contents: batch.contents || '',
        status: batch.status || 'Active',
        quantity: {
          value: batch.quantity?.value?.toString() || '',
          unit: batch.quantity?.unit || 'kg',
        },
        notes: batch.notes || '',
      })
      setIsOverlayOpen(true)
    } catch (error) {
      console.error('Error fetching batch:', error)
      alert('Failed to load batch details')
    }
  }

  const handleDelete = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) {
      return
    }
    try {
      await batchesAPI.delete(batchId)
      fetchBatches()
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert(error.message || 'Failed to delete batch')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const submitData = {
        ...formData,
        quantity: {
          value: parseFloat(formData.quantity.value),
          unit: formData.quantity.unit,
        },
        notes: formData.notes || undefined,
      }
      await batchesAPI.update(editingBatch._id, submitData)
      setIsOverlayOpen(false)
      setEditingBatch(null)
      setFormData({
        batchNumber: '',
        rawMaterial: '',
        source: '',
        productionDate: '',
        acquisitionDate: '',
        buyer: '',
        contents: '',
        status: 'Active',
        quantity: {
          value: '',
          unit: 'kg',
        },
        notes: '',
      })
      fetchBatches()
    } catch (error) {
      console.error('Error updating batch:', error)
      alert(error.message || 'Failed to update batch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
          <p className="mt-2 text-gray-600">Track batch data including source, production date, buyer, and contents</p>
        </div>
        <button
          onClick={() => setIsOverlayOpen(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Batch
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${isFilterOpen ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Supplier</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
                    <input
                      type="text"
                      value={buyerFilter}
                      onChange={(e) => setBuyerFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Buyer name"
                    />
                  </div>
                  {(statusFilter || sourceFilter || buyerFilter) && (
                    <button
                      onClick={() => {
                        setStatusFilter('')
                        setSourceFilter('')
                        setBuyerFilter('')
                        setIsFilterOpen(false)
                      }}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Raw Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Production Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acquisition Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No batches found
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batchNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {typeof batch.rawMaterial === 'object' ? batch.rawMaterial.name : batch.rawMaterial}
                      </div>
                      <div className="text-xs text-gray-500">{batch.contents}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {typeof batch.source === 'object' && batch.source
                          ? batch.source.name
                          : batch.source || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(batch.productionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(batch.acquisitionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.buyer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${batch.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : batch.status === 'Completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleView(batch._id)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(batch._id)}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(batch._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Overlay */}
      {isOverlayOpen && (
        <Modal>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBatch ? 'Edit Batch' : 'Create New Batch'}
                </h2>
                <button
                  onClick={handleCloseOverlay}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <form onSubmit={editingBatch ? handleUpdate : handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingBatch}
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter batch number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raw Material <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.rawMaterial}
                      onChange={(e) => setFormData({ ...formData, rawMaterial: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select raw material</option>
                      {rawMaterials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Supplier <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Production Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.productionDate}
                      onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acquisition Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buyer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buyer}
                    onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter buyer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contents <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contents}
                    onChange={(e) => setFormData({ ...formData, contents: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter contents description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.quantity.value}
                      onChange={(e) => setFormData({
                        ...formData,
                        quantity: { ...formData.quantity, value: e.target.value },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.quantity.unit}
                      onChange={(e) => setFormData({
                        ...formData,
                        quantity: { ...formData.quantity, unit: e.target.value },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="g">g</option>
                      <option value="mL">mL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseOverlay}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (editingBatch ? 'Updating...' : 'Creating...') : (editingBatch ? 'Update Batch' : 'Create Batch')}
                  </button>
                </div>
              </form>
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
                    <label className="block text-sm font-medium text-gray-700">Raw Material</label>
                    <p className="mt-1 text-gray-900">
                      {typeof viewingBatch.rawMaterial === 'object' ? viewingBatch.rawMaterial.name : viewingBatch.rawMaterial}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source Supplier</label>
                    <p className="mt-1 text-gray-900">
                      {typeof viewingBatch.source === 'object' && viewingBatch.source
                        ? viewingBatch.source.name
                        : viewingBatch.source || 'N/A'}
                    </p>
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
                    <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${viewingBatch.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : viewingBatch.status === 'Completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {viewingBatch.status}
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

export default Batches

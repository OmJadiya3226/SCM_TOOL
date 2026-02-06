import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { rawMaterialsAPI, suppliersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'

const RawMaterials = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    purity: '',
    supplier: '',
    hazardClass: '',
    storageTemp: '',
    status: 'In Stock',
    quantity: {
      value: '',
      unit: 'kg',
    },
    expiryDate: '',
    lotNumber: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [viewingMaterial, setViewingMaterial] = useState(null)
  const [editingMaterial, setEditingMaterial] = useState(null)

  useEffect(() => {
    fetchMaterials()
    if (isOverlayOpen) {
      fetchSuppliers()
    }
  }, [searchTerm, statusFilter, isOverlayOpen])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter

      const data = await rawMaterialsAPI.getAll(params)
      setMaterials(data)
    } catch (error) {
      console.error('Error fetching raw materials:', error)
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
        expiryDate: formData.expiryDate || undefined,
      }
      await rawMaterialsAPI.create(submitData)
      setIsOverlayOpen(false)
      setFormData({
        name: '',
        purity: '',
        supplier: '',
        hazardClass: '',
        storageTemp: '',
        status: 'In Stock',
        quantity: {
          value: '',
          unit: 'kg',
        },
        expiryDate: '',
        lotNumber: '',
        description: '',
      })
      fetchMaterials()
    } catch (error) {
      console.error('Error creating raw material:', error)
      alert(error.message || 'Failed to create raw material')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false)
    setEditingMaterial(null)
    setFormData({
      name: '',
      purity: '',
      supplier: '',
      hazardClass: '',
      storageTemp: '',
      status: 'In Stock',
      quantity: {
        value: '',
        unit: 'kg',
      },
      expiryDate: '',
      lotNumber: '',
      description: '',
    })
  }

  const handleView = async (materialId) => {
    try {
      const material = await rawMaterialsAPI.getById(materialId)
      setViewingMaterial(material)
    } catch (error) {
      console.error('Error fetching raw material:', error)
      alert('Failed to load raw material details')
    }
  }

  const handleEdit = async (materialId) => {
    try {
      const material = await rawMaterialsAPI.getById(materialId)
      setEditingMaterial(material)
      setFormData({
        name: material.name || '',
        purity: material.purity || '',
        supplier: (typeof material.supplier === 'object' && material.supplier)
          ? material.supplier._id
          : material.supplier || '',
        hazardClass: material.hazardClass || '',
        storageTemp: material.storageTemp || '',
        status: material.status || 'In Stock',
        quantity: {
          value: material.quantity?.value?.toString() || '',
          unit: material.quantity?.unit || 'kg',
        },
        expiryDate: material.expiryDate ? new Date(material.expiryDate).toISOString().split('T')[0] : '',
        lotNumber: material.lotNumber || '',
        description: material.description || '',
      })
      setIsOverlayOpen(true)
    } catch (error) {
      console.error('Error fetching raw material:', error)
      alert('Failed to load raw material details')
    }
  }

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this raw material?')) {
      return
    }
    try {
      await rawMaterialsAPI.delete(materialId)
      fetchMaterials()
    } catch (error) {
      console.error('Error deleting raw material:', error)
      alert(error.message || 'Failed to delete raw material')
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
        expiryDate: formData.expiryDate || undefined,
      }
      await rawMaterialsAPI.update(editingMaterial._id, submitData)
      setIsOverlayOpen(false)
      setEditingMaterial(null)
      setFormData({
        name: '',
        purity: '',
        supplier: '',
        hazardClass: '',
        storageTemp: '',
        status: 'In Stock',
        quantity: {
          value: '',
          unit: 'kg',
        },
        expiryDate: '',
        lotNumber: '',
        description: '',
      })
      fetchMaterials()
    } catch (error) {
      console.error('Error updating raw material:', error)
      alert(error.message || 'Failed to update raw material')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
          <p className="mt-2 text-gray-600">Manage raw materials with purity, suppliers, hazard classes, and storage conditions</p>
        </div>
        <button
          onClick={() => setIsOverlayOpen(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Raw Material
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search raw materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 mr-2 text-gray-600" />
            Filter
          </button>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hazard Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Storage Conditions
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
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No raw materials found
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-500">
                        {material.quantity?.value} {material.quantity?.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">{material.purity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {typeof material.supplier === 'object' && material.supplier
                          ? material.supplier.name
                          : material.supplier || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        {material.hazardClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{material.storageTemp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${material.status === 'In Stock'
                          ? 'bg-green-100 text-green-800'
                          : material.status === 'Low Stock'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {material.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleView(material._id)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(material._id)}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(material._id)}
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

      {/* Add Raw Material Overlay */}
      {isOverlayOpen && (
        <Modal>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
                </h2>
                <button
                  onClick={handleCloseOverlay}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <form onSubmit={editingMaterial ? handleUpdate : handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter material name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.purity}
                      onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 99.9%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hazard Class <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hazardClass}
                      onChange={(e) => setFormData({ ...formData, hazardClass: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Class 3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Temperature <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storageTemp}
                    onChange={(e) => setFormData({ ...formData, storageTemp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 2-8°C"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter lot number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Additional description..."
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
                    {submitting ? (editingMaterial ? 'Updating...' : 'Creating...') : (editingMaterial ? 'Update Raw Material' : 'Create Raw Material')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* View Raw Material Modal */}
      {viewingMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
      )}
    </div>
  )
}

export default RawMaterials

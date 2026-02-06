import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { suppliersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'

const Suppliers = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    status: 'Pending',
    certifications: [],
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    notes: '',
    qualityIssues: [],
    lastAudit: '',
  })
  const [certificationInput, setCertificationInput] = useState('')
  const [certificationExpiry, setCertificationExpiry] = useState('')
  const [qualityIssueInput, setQualityIssueInput] = useState('')
  const [qualityIssueDate, setQualityIssueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewingSupplier, setViewingSupplier] = useState(null)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [deletingSupplier, setDeletingSupplier] = useState(null)

  useEffect(() => {
    fetchSuppliers()
  }, [searchTerm, statusFilter])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter

      const data = await suppliersAPI.getAll(params)
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCertification = () => {
    if (certificationInput.trim()) {
      const newCert = {
        name: certificationInput.trim(),
        expiryDate: certificationExpiry || undefined,
      }
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCert],
      })
      setCertificationInput('')
      setCertificationExpiry('')
    }
  }

  const handleRemoveCertification = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    })
  }


  const handleAddQualityIssue = () => {
    if (qualityIssueInput.trim()) {
      const newIssue = {
        description: qualityIssueInput.trim(),
        date: qualityIssueDate || new Date().toISOString().split('T')[0],
      }
      setFormData({
        ...formData,
        qualityIssues: [...formData.qualityIssues, newIssue],
      })
      setQualityIssueInput('')
      setQualityIssueDate('')
    }
  }

  const handleRemoveQualityIssue = (index) => {
    setFormData({
      ...formData,
      qualityIssues: formData.qualityIssues.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await suppliersAPI.create(formData)
      setIsOverlayOpen(false)
      setFormData({
        name: '',
        status: 'Pending',
        certifications: [],
        contactEmail: '',
        contactPhone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },

        notes: '',
        qualityIssues: [],
        lastAudit: '',
      })
      setCertificationInput('')
      setQualityIssueInput('')
      setQualityIssueDate('')
      fetchSuppliers()
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert(error.message || 'Failed to create supplier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      status: 'Pending',
      certifications: [],
      contactEmail: '',
      contactPhone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      notes: '',
      qualityIssues: [],
      lastAudit: '',
    })
    setCertificationInput('')
    setQualityIssueInput('')
    setQualityIssueDate('')
    setCertificationExpiry('')
  }

  const handleView = async (supplierId) => {
    try {
      const supplier = await suppliersAPI.getById(supplierId)
      setViewingSupplier(supplier)
    } catch (error) {
      console.error('Error fetching supplier:', error)
      alert('Failed to load supplier details')
    }
  }

  const handleEdit = async (supplierId) => {
    try {
      const supplier = await suppliersAPI.getById(supplierId)
      setEditingSupplier(supplier)
      // Convert old string format to new object format if needed
      const certifications = (supplier.certifications || []).map(cert => {
        if (typeof cert === 'string') {
          return { name: cert, expiryDate: undefined }
        }
        return cert
      })
      setFormData({
        name: supplier.name || '',
        status: supplier.status || 'Pending',
        certifications: certifications,
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        address: supplier.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        notes: supplier.notes || '',
        qualityIssues: Array.isArray(supplier.qualityIssues) ? supplier.qualityIssues : [],
        lastAudit: supplier.lastAudit ? new Date(supplier.lastAudit).toISOString().split('T')[0] : '',
      })
      setIsOverlayOpen(true)
    } catch (error) {
      console.error('Error fetching supplier:', error)
      alert('Failed to load supplier details')
    }
  }

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return
    }
    try {
      await suppliersAPI.delete(supplierId)
      fetchSuppliers()
      setDeletingSupplier(null)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert(error.message || 'Failed to delete supplier')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await suppliersAPI.update(editingSupplier._id, formData)
      setIsOverlayOpen(false)
      setEditingSupplier(null)
      setFormData({
        name: '',
        status: 'Pending',
        certifications: [],
        contactEmail: '',
        contactPhone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },

        notes: '',
        qualityIssues: [],
        lastAudit: '',
      })
      setCertificationInput('')
      setQualityIssueInput('')
      setQualityIssueDate('')
      fetchSuppliers()
    } catch (error) {
      console.error('Error updating supplier:', error)
      alert(error.message || 'Failed to update supplier')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-2 text-gray-600">Manage approved vendors, certifications, and quality issues</p>
        </div>
        <button
          onClick={() => setIsOverlayOpen(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
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

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Audit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${supplier.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : supplier.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {supplier.certifications && supplier.certifications.length > 0 ? (
                          supplier.certifications.map((cert, idx) => {
                            const certName = typeof cert === 'string' ? cert : cert.name
                            return (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                title={typeof cert === 'object' && cert.expiryDate ? `Expires: ${new Date(cert.expiryDate).toLocaleDateString()}` : ''}
                              >
                                {certName}
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-xs text-gray-400">No certifications</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm ${(supplier.qualityIssues?.length || 0) === 0
                          ? 'text-green-600'
                          : 'text-red-600 font-medium'
                          }`}
                      >
                        {supplier.qualityIssues?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.lastAudit ? new Date(supplier.lastAudit).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleView(supplier._id)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(supplier._id)}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(supplier._id)}
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

      {/* Add Supplier Overlay */}
      {isOverlayOpen && (
        <Modal>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <button
                  onClick={handleCloseOverlay}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <form onSubmit={editingSupplier ? handleUpdate : handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter supplier name"
                  />
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
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={certificationInput}
                      onChange={(e) => setCertificationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Certification name"
                    />
                    <input
                      type="date"
                      value={certificationExpiry}
                      onChange={(e) => setCertificationExpiry(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Expiry date (optional)"
                    />
                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, index) => {
                      const certName = typeof cert === 'string' ? cert : cert.name
                      const certExpiry = typeof cert === 'object' ? cert.expiryDate : null
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                          title={certExpiry ? `Expires: ${new Date(certExpiry).toLocaleDateString()}` : ''}
                        >
                          {certName}
                          {certExpiry && (
                            <span className="text-xs text-blue-600">
                              ({new Date(certExpiry).toLocaleDateString()})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(index)}
                            className="hover:text-blue-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Street Address"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value },
                        })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value },
                        })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zipCode: e.target.value },
                        })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="ZIP Code"
                      />
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, country: e.target.value },
                        })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Issues
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={qualityIssueInput}
                      onChange={(e) => setQualityIssueInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQualityIssue())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Issue description"
                    />
                    <input
                      type="date"
                      value={qualityIssueDate}
                      onChange={(e) => setQualityIssueDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddQualityIssue}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.qualityIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 text-red-800 rounded-lg text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{issue.description}</span>
                          <span className="text-xs text-red-600">
                            {new Date(issue.date).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQualityIssue(index)}
                          className="hover:text-red-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Audit Date
                  </label>
                  <input
                    type="date"
                    value={formData.lastAudit}
                    onChange={(e) => setFormData({ ...formData, lastAudit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
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
                    {submitting ? (editingSupplier ? 'Updating...' : 'Creating...') : (editingSupplier ? 'Update Supplier' : 'Create Supplier')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* View Supplier Modal */}
      {viewingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                      return (
                        <div key={idx} className="flex flex-col">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {certName}
                          </span>
                          {certExpiry && (
                            <span className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(certExpiry).toLocaleDateString()}
                            </span>
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
      )}
    </div>
  )
}

export default Suppliers

import { useState, useEffect } from 'react'
import { Search, Filter, X, User } from 'lucide-react'
import { usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'

const Employees = () => {
    const { user: currentUser } = useAuth()
    const isAdmin = currentUser?.role === 'admin'
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isOverlayOpen, setIsOverlayOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        isActive: true,
        password: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [viewingEmployee, setViewingEmployee] = useState(null)
    const [editingEmployee, setEditingEmployee] = useState(null)

    useEffect(() => {
        if (isAdmin) {
            fetchEmployees()
        }
    }, [searchTerm, roleFilter])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            const params = {}
            if (searchTerm) params.search = searchTerm
            if (roleFilter && roleFilter !== 'all') params.role = roleFilter

            const data = await usersAPI.getAll(params)
            setEmployees(data)
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCloseOverlay = () => {
        setIsOverlayOpen(false)
        setEditingEmployee(null)
        setFormData({
            name: '',
            email: '',
            role: 'user',
            isActive: true,
            password: '',
        })
    }

    const handleView = (employee) => {
        setViewingEmployee(employee)
    }

    const handleEdit = (employee) => {
        setEditingEmployee(employee)
        setFormData({
            name: employee.name || '',
            email: employee.email || '',
            role: employee.role || 'user',
            isActive: employee.isActive ?? true,
            password: '', // Password stays empty unless changing
        })
        setIsOverlayOpen(true)
    }

    const handleDelete = async (employeeId) => {
        if (employeeId === currentUser._id) {
            alert('You cannot delete your own admin account')
            return
        }
        if (!window.confirm('Are you sure you want to delete this employee account?')) {
            return
        }
        try {
            await usersAPI.delete(employeeId)
            fetchEmployees()
        } catch (error) {
            console.error('Error deleting employee:', error)
            alert(error.message || 'Failed to delete employee')
        }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            await usersAPI.update(editingEmployee._id, formData)
            handleCloseOverlay()
            fetchEmployees()
        } catch (error) {
            console.error('Error updating employee:', error)
            alert(error.message || 'Failed to update employee')
        } finally {
            setSubmitting(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                    <p className="mt-2 text-gray-600">Manage user accounts, roles, and access levels</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees by name or email..."
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
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">All Roles</option>
                                            <option value="admin">Admin</option>
                                            <option value="user">User</option>
                                            <option value="qa-worker">QA Worker</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setRoleFilter('')
                                            setIsFilterOpen(false)
                                        }}
                                        className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Clear Filter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-gray-500" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                                    <div className="text-sm text-gray-500">{employee.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : employee.role === 'qa-worker'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {employee.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {employee.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(employee.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleView(employee)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEdit(employee)}
                                                className="text-gray-600 hover:text-gray-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            {employee.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(employee._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Employee Modal */}
            {isOverlayOpen && (
                <Modal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                                <h2 className="text-xl font-bold text-gray-900">Edit Employee Account</h2>
                                <button onClick={handleCloseOverlay} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="qa-worker">QA Worker</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center mt-6">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active Account</label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password <span className="text-xs text-gray-500">(Leave blank to keep current)</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseOverlay}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>
            )}

            {/* View Employee Modal */}
            {viewingEmployee && (
                <Modal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
                                <button onClick={() => setViewingEmployee(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-center">
                                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                                        <User className="w-10 h-10 text-gray-500" />
                                    </div>
                                </div>
                                <div className="text-center pb-4">
                                    <h3 className="text-lg font-bold text-gray-900">{viewingEmployee.name}</h3>
                                    <p className="text-gray-500">{viewingEmployee.email}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 mb-1">Role</p>
                                        <p className="font-semibold capitalize">{viewingEmployee.role}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 mb-1">Status</p>
                                        <p className={`font-semibold ${viewingEmployee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                            {viewingEmployee.isActive ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                                        <p className="text-gray-500 mb-1">Member Since</p>
                                        <p className="font-semibold">{new Date(viewingEmployee.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={() => setViewingEmployee(null)}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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

export default Employees

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

const Account = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    // Account deletion state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('Please fill in all fields')
            return
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }

        setPasswordLoading(true)
        try {
            await authAPI.changePassword(currentPassword, newPassword)
            setPasswordSuccess('Password changed successfully!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            setPasswordError(error.message || 'Failed to change password')
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        setDeleteLoading(true)
        try {
            await authAPI.deleteAccount()
            logout()
            navigate('/login')
        } catch (error) {
            alert(error.message || 'Failed to delete account')
            setDeleteLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
                <p className="text-gray-600 mt-2">Manage your account settings and security</p>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center mb-4">
                    <Lock className="w-6 h-6 text-primary-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter current password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter new password (min 6 characters)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Confirm new password"
                        />
                    </div>

                    {passwordError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                            {passwordSuccess}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {passwordLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
                <div className="flex items-center mb-4">
                    <Trash2 className="w-6 h-6 text-red-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                            <p className="font-semibold mb-1">Warning: This action cannot be undone!</p>
                            <p>Deleting your account will permanently remove all your data and you will be immediately logged out.</p>
                        </div>
                    </div>
                </div>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Delete My Account
                    </button>
                ) : (
                    <div className="space-y-3">
                        <p className="text-center font-semibold text-gray-900">Are you absolutely sure?</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                            >
                                {deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Account

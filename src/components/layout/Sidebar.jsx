import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Layers,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/suppliers', icon: Users, label: 'Suppliers' },
    { path: '/raw-materials', icon: Package, label: 'Raw Materials' },
    { path: '/batches', icon: Layers, label: 'Batches' },
    ...(isAdmin ? [{ path: '/admin-stats', icon: BarChart3, label: 'Admin Stats' }] : []),
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {isOpen && (
            <h1 className="text-xl font-bold text-primary-600">SCM Tool</h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''} ${
                    !isOpen ? 'justify-center' : ''
                  }`
                }
                title={!isOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              SCM Tool v1.0.0
            </p>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar

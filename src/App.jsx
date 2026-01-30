import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Suppliers from './pages/Suppliers'
import RawMaterials from './pages/RawMaterials'
import Batches from './pages/Batches'

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/raw-materials" element={<RawMaterials />} />
          <Route path="/batches" element={<Batches />} />
        </Routes>
      </DashboardLayout>
    </Router>
  )
}

export default App

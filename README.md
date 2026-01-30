# SCM Tool - Supply Chain Management for Chemical Manufacturing

A comprehensive web-based Supply Chain Management system designed for chemical manufacturing companies to manage raw materials, suppliers, and batch tracking with regulatory compliance and quality assurance.

## 🚀 Features

### 1. Raw Material Management
- Purity tracking and validation
- Approved suppliers list integration
- Hazard class classification (GHS, DOT, etc.)
- Storage conditions monitoring
- Expiry date tracking
- Lot number management

### 2. Supplier Management
- Approved vendors list with status tracking
- Certification management (ISO, GMP, etc.)
- Quality issue history and tracking
- Supplier performance metrics
- Audit trail for supplier interactions

### 3. Batch Management
- Complete batch traceability
- Source tracking (supplier, acquisition date, production date)
- Buyer information management
- Batch contents and composition tracking
- Batch genealogy and chain of custody

### 4. Admin Dashboard
- Real-time inventory overview
- Supplier performance metrics
- Compliance status dashboard
- Alert and notification center
- Responsive design for all devices

## 🛠️ Technology Stack

- **Frontend Framework:** React.js 19
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Package Manager:** npm

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SCM_TOOL
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
SCM_TOOL/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── DashboardLayout.jsx
│   │       ├── Sidebar.jsx
│   │       └── Navbar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Suppliers.jsx
│   │   ├── RawMaterials.jsx
│   │   └── Batches.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── PROJECT_DELIVERABLES.md
├── GANTT_CHART.md
└── README.md
```

## 🎨 Features Overview

### Dashboard
- Overview statistics
- Recent batches
- Supplier alerts
- Quick access to all modules

### Suppliers Page
- View all suppliers
- Filter and search functionality
- Certification tracking
- Quality issues history

### Raw Materials Page
- Material inventory
- Purity and specifications
- Storage conditions
- Supplier information

### Batches Page
- Batch creation and tracking
- Source traceability
- Production and acquisition dates
- Buyer information

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔒 Security & Compliance

The application is designed to support:
- FDA CFR 21 Part 11 compliance
- GHS (Globally Harmonized System) compliance
- REACH compliance for EU markets
- ISO 9001/14001 support

## 📊 Project Timeline

See `GANTT_CHART.md` for detailed Software Development Lifecycle timeline (24 weeks).

## 📄 Project Deliverables

See `PROJECT_DELIVERABLES.md` for complete list of deliverables and benefits.

## 🤝 Contributing

This is a private repository. For contributions, please contact the project administrator.

## 📧 Support

For support and inquiries, please contact: admin@scmtool.com

## 📜 License

ISC License

---

**Version:** 1.0.0  
**Last Updated:** January 27, 2026

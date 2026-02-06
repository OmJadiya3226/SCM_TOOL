# Authentication & Role-Based Access Control Implementation

This document describes the authentication system and role-based access control (RBAC) implementation for the Supply Chain Management system.

## ✅ Features Implemented

### 1. User Registration System
- **Registration Page** (`/register`): Unified registration form for both users and admins
- **Secret Password Protection**: 
  - Users must provide `USER_SECRET_PASSWORD` from `.env` to register as regular users
  - Admins must provide `ADMIN_SECRET_PASSWORD` from `.env` to register as admins
- **Role Selection**: Users can choose their account type during registration
- **Password Validation**: Minimum 6 characters, password confirmation required

### 2. Login System
- **Login Page** (`/login`): Secure authentication for all users
- **JWT Token Authentication**: Tokens stored in localStorage
- **Automatic Session Management**: Users stay logged in across page refreshes
- **Protected Routes**: All dashboard routes require authentication

### 3. Role-Based Access Control

#### Admin Privileges
- ✅ Full access to all features
- ✅ Can view **Admin Stats** page (exclusive to admins)
- ✅ Can **Create, Read, Update, and Delete** all data
- ✅ Can access dashboard statistics and analytics
- ✅ Can see supplier alerts and recent batches

#### User Privileges
- ✅ Can **Create and Delete** data in:
  - Suppliers
  - Raw Materials
  - Batches
- ✅ Can **View** all data
- ❌ **Cannot Edit** existing records (Edit buttons hidden)
- ❌ **Cannot access Admin Stats** page
- ❌ **Cannot view** admin dashboard statistics

### 4. UI/UX Features
- **Sidebar Navigation**: 
  - Shows "Admin Stats" tab only for admin users
  - All other menu items visible to all authenticated users
- **Action Buttons**: 
  - Edit buttons hidden for regular users
  - Add/Delete buttons visible to all users
- **User Profile**: 
  - Shows user name and email in navbar
  - Logout functionality
- **Protected Routes**: 
  - Automatic redirect to login if not authenticated
  - Loading states during authentication checks

## 🔐 Security Features

1. **Secret Password Protection**
   - Registration requires secret passwords stored in `.env`
   - Different passwords for users and admins
   - Prevents unauthorized account creation

2. **JWT Authentication**
   - Secure token-based authentication
   - Tokens expire after 30 days
   - Automatic token validation on protected routes

3. **Password Hashing**
   - Bcrypt with salt rounds
   - Passwords never stored in plain text

4. **Role-Based API Protection**
   - Backend routes protected with middleware
   - Admin-only endpoints require admin role
   - Update operations restricted to admins

## 📁 Files Modified/Created

### Backend Files
- `server/routes/authRoutes.js` - Updated registration to check secret passwords
- `server/middleware/auth.js` - Admin role checking middleware
- `server/routes/supplierRoutes.js` - PUT route restricted to admins
- `server/routes/rawMaterialRoutes.js` - PUT route restricted to admins
- `server/routes/batchRoutes.js` - PUT route restricted to admins
- `server/routes/dashboardRoutes.js` - All routes restricted to admins

### Frontend Files
- `src/pages/Login.jsx` - Login page with registration link
- `src/pages/Register.jsx` - **NEW** - Registration page with secret password
- `src/pages/AdminStats.jsx` - **NEW** - Admin-only statistics page
- `src/context/AuthContext.jsx` - Updated to handle secret passwords
- `src/services/api.js` - Updated register API to include secret password
- `src/App.jsx` - Added register route and admin stats route
- `src/components/layout/Sidebar.jsx` - Shows admin stats only for admins
- `src/pages/Suppliers.jsx` - Hide edit buttons for users
- `src/pages/RawMaterials.jsx` - Hide edit buttons for users
- `src/pages/Batches.jsx` - Hide edit buttons for users
- `src/pages/Dashboard.jsx` - Handle admin-only API calls gracefully

### Documentation
- `ENV_SETUP.md` - **NEW** - Environment variables setup guide
- `MONGODB_SETUP.md` - Updated with secret password information
- `AUTHENTICATION_IMPLEMENTATION.md` - **NEW** - This file

## 🔧 Environment Variables

Add these to your `.env` file:

```env
USER_SECRET_PASSWORD=your_user_secret_password_here
ADMIN_SECRET_PASSWORD=your_admin_secret_password_here
```

See `ENV_SETUP.md` for complete environment variable documentation.

## 🚀 Usage

### Registering a New User

1. Navigate to `/register`
2. Fill in the registration form:
   - Name
   - Email
   - Select "User" or "Admin" role
   - Enter the corresponding secret password
   - Create a password (minimum 6 characters)
   - Confirm password
3. Click "Create account"
4. You'll be automatically logged in and redirected to the dashboard

### Registering an Admin

1. Navigate to `/register`
2. Select "Admin" as the account type
3. Enter the `ADMIN_SECRET_PASSWORD` from your `.env` file
4. Complete the rest of the form
5. You'll have full admin privileges

### Logging In

1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign in"
4. You'll be redirected to the dashboard

### Accessing Admin Stats

1. Log in as an admin
2. The "Admin Stats" tab will appear in the sidebar
3. Click it to view comprehensive analytics

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (requires secret password)
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123",
    "role": "user" | "admin",
    "secretPassword": "secret_password_from_env"
  }
  ```
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Protected Routes
All routes below require authentication (Bearer token in Authorization header)

#### Admin-Only Routes
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-batches` - Recent batches
- `GET /api/dashboard/supplier-alerts` - Supplier alerts
- `PUT /api/suppliers/:id` - Update supplier
- `PUT /api/raw-materials/:id` - Update raw material
- `PUT /api/batches/:id` - Update batch

#### User & Admin Routes
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `GET /api/raw-materials` - Get all materials
- `POST /api/raw-materials` - Create material
- `DELETE /api/raw-materials/:id` - Delete material
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create batch
- `DELETE /api/batches/:id` - Delete batch

## 🔒 Security Best Practices

1. **Change Default Secret Passwords**: Use strong, unique passwords
2. **Keep .env Secure**: Never commit `.env` file to version control
3. **Use Strong JWT Secret**: Generate a random string for JWT_SECRET
4. **Regular Password Updates**: Encourage users to change passwords regularly
5. **Monitor Admin Accounts**: Keep track of who has admin access

## 🐛 Troubleshooting

### "Invalid secret password" Error
- Verify the secret password matches the one in `.env`
- Check for typos or extra spaces
- Ensure the role matches the secret password type

### Cannot Access Admin Stats
- Verify you're logged in as an admin
- Check that your user role is "admin" in the database
- Try logging out and back in

### Edit Buttons Not Showing
- This is expected behavior for regular users
- Only admins can see and use edit buttons
- Users can still add and delete records

## 📝 Notes

- Secret passwords are case-sensitive
- Users cannot change their role after registration
- Admin accounts should be created carefully
- All passwords (user passwords and secret passwords) should be strong and unique

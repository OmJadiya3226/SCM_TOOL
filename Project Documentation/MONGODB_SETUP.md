# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas connection for the Supply Chain Management system.

## Prerequisites

1. A MongoDB Atlas account (free tier available at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
2. Node.js installed on your system

## Step 1: Create MongoDB Atlas Cluster

1. Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier M0 is sufficient for development)
3. Wait for the cluster to be created (takes a few minutes)

## Step 2: Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Create a username and password (save these credentials securely)
5. Set user privileges to **Read and write to any database**
6. Click **Add User**

## Step 3: Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development, click **Allow Access from Anywhere** (0.0.0.0/0)
   - **Note:** For production, restrict to specific IP addresses
4. Click **Confirm**

## Step 4: Get Connection String

1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Select **Node.js** as the driver
5. Copy the connection string (it looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

## Step 5: Configure Environment Variables

1. Create a `.env` file in the root directory of the project
2. Add the following variables:

```env
# MongoDB Atlas Connection String
# Replace <username> and <password> with your database user credentials
# Replace <database-name> with your preferred database name (e.g., scm_tool)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority

# JWT Secret for authentication
# Generate a strong random string (you can use: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# Secret Passwords for Registration
# These passwords are required when creating new accounts
# Users must provide USER_SECRET_PASSWORD to register as a regular user
# Admins must provide ADMIN_SECRET_PASSWORD to register as an admin
# Change these to strong, unique passwords
USER_SECRET_PASSWORD=user_secret_password_123
ADMIN_SECRET_PASSWORD=admin_secret_password_456
```

**Important:** 
- Replace `<username>` and `<password>` with your actual database user credentials
- Replace `<database-name>` with your preferred database name (e.g., `scm_tool`)
- Replace the cluster URL with your actual cluster URL
- Change `JWT_SECRET` to a strong random string for security
- **Change `USER_SECRET_PASSWORD` and `ADMIN_SECRET_PASSWORD` to strong, unique passwords**
- These secret passwords are required for account registration - only users with the correct secret can register for that role

## Step 6: Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

## Step 7: Start the Server

Start the backend server:

```bash
npm run server
```

Or for development with auto-reload:

```bash
npm run dev:server
```

The server should start on port 5000 and connect to MongoDB Atlas.

## Step 8: Create Admin User

You can create an admin user by making a POST request to `/api/auth/register`:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@scmtool.com",
    "password": "your_secure_password",
    "role": "admin",
    "secretPassword": "admin_secret_password_456"
  }'
```

**Note:** Replace `"admin_secret_password_456"` with the actual `ADMIN_SECRET_PASSWORD` value from your `.env` file.

For regular users, use:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regular User",
    "email": "user@scmtool.com",
    "password": "your_secure_password",
    "role": "user",
    "secretPassword": "user_secret_password_123"
  }'
```

Or use the registration page in the web application at `/register`.

## Troubleshooting

### Connection Issues

1. **Authentication failed**: Check your username and password in the connection string
2. **Network access denied**: Ensure your IP address is whitelisted in Network Access
3. **Connection timeout**: Check your internet connection and firewall settings

### Common Errors

- **MongooseError**: Make sure your connection string is correct and includes the database name
- **JWT errors**: Ensure JWT_SECRET is set in your .env file
- **Port already in use**: Change the PORT in .env or stop the process using port 5000

## Security Notes

1. **Never commit `.env` file** to version control (already in .gitignore)
2. **Use strong passwords** for database users
3. **Restrict IP access** in production environments
4. **Use environment-specific secrets** for JWT_SECRET
5. **Enable MongoDB Atlas encryption** for production databases

## Next Steps

Once connected, you can:
1. Start the frontend: `npm run dev`
2. Start the backend: `npm run server`
3. Access the application at `http://localhost:3000`
4. Login with your admin credentials

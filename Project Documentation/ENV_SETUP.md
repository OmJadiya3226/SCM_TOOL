# Environment Variables Setup

This document describes all environment variables required for the Supply Chain Management system.

## Required Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```env
# MongoDB Atlas Connection String
# Replace <username>, <password>, and <database-name> with your actual values
# Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database-name>?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scm_tool?retryWrites=true&w=majority

# JWT Secret for authentication
# Generate a strong random string for production
# You can use: openssl rand -base64 32
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

## Important Security Notes

1. **Never commit `.env` file** to version control (already in .gitignore)
2. **Use strong passwords** for secret passwords (minimum 12 characters recommended)
3. **Use different passwords** for USER_SECRET_PASSWORD and ADMIN_SECRET_PASSWORD
4. **Change default values** before deploying to production
5. **Keep secrets secure** - only share with authorized personnel

## How Secret Passwords Work

- When a user tries to register, they must provide the correct secret password based on their role:
  - **Regular Users**: Must provide `USER_SECRET_PASSWORD` to create a user account
  - **Admins**: Must provide `ADMIN_SECRET_PASSWORD` to create an admin account
- This prevents unauthorized account creation
- Only users with the correct secret password can register for that specific role

## Generating Strong Passwords

You can generate strong random passwords using:

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Online Tools:**
- Use a password generator like [1Password Generator](https://1password.com/password-generator/) or similar

## Example .env File

```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/scm_tool?retryWrites=true&w=majority
JWT_SECRET=K8mN2pQ5rT7vW9xZ1aB3cD4eF6gH8jL0mN2pQ5rT7vW9xZ1aB3cD4eF6gH8j
PORT=5000
NODE_ENV=development
USER_SECRET_PASSWORD=MySecureUserPassword2024!
ADMIN_SECRET_PASSWORD=MySecureAdminPassword2024!
```

## Troubleshooting

### Registration Fails with "Invalid secret password"
- Verify that the secret password in `.env` matches what the user is entering
- Check for extra spaces or typos
- Ensure the role selected matches the secret password being used

### Cannot Connect to MongoDB
- Verify MONGODB_URI is correct
- Check that username and password are URL-encoded if they contain special characters
- Ensure network access is configured in MongoDB Atlas

### JWT Errors
- Verify JWT_SECRET is set and not empty
- Ensure JWT_SECRET is a strong random string
- Restart the server after changing JWT_SECRET

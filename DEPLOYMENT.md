# 🚀 Hostinger VPS Deployment Guide

This guide explains how to deploy this full-stack application (FastAPI + React + PostgreSQL) to your Hostinger VPS using the Docker Manager.

## 1. Local Preparation (Push to GitHub)
Run the following command on your local machine to push the latest code to GitHub:
```bash
./deploy.sh
```

## 2. Hostinger VPS Configuration
1. Login to **Hostinger Dashboard > VPS > Docker Manager**.
2. **Repository URL:** Use your private URL with your GitHub Personal Access Token (PAT):
   `https://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@github.com/himanshu263/eCommerce-MDM.git`
3. **Branch:** `main`
4. Click **Deploy** or **Update**.

## 3. Database Seeding (First-Time Only)
Once the containers are "Running" on the VPS, you must create the initial admin user. Open the **Hostinger VPS Terminal** and run these two commands:

### A. Create Admin Group
```bash
docker exec -it myapp_db psql -U postgres -d myapp_db -c "INSERT INTO groups (group_name, group_code, is_active, permissions) VALUES ('Administrators', 'ADMIN', true, '{\"can_view\":true,\"can_create\":true,\"can_edit\":true,\"can_delete\":true,\"can_export\":true}') ON CONFLICT DO NOTHING;"
```

### B. Create Admin User
```bash
docker exec -it myapp_db psql -U postgres -d myapp_db -c "INSERT INTO users (username, email, hashed_password, full_name, is_active, group_id) SELECT 'admin', 'admin@myapp.com', '\$pbkdf2-sha256\$29000\$SkkJ4XzvnVNqzbm31prT2g\$pe/x6hePKn5zbzCeEccsUVnNpNmfnq0h9g/8i1pQ0aE', 'System Administrator', true, id FROM groups WHERE group_code = 'ADMIN' ON CONFLICT DO NOTHING;"
```

## 4. Final Application Details
- **URL:** `http://YOUR_VPS_IP`
- **Login:** `admin` / `Admin@123`
- **API Docs:** `http://YOUR_VPS_IP/api/docs`
- **Database UI:** `http://YOUR_VPS_IP:5050` (pgAdmin4)

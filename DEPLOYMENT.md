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


   `
Ubuntu 24.04.4 LTS srv1496286 ttyS0

srv1496286 login: root
Password: 
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-90-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Sun Mar 29 15:46:23 UTC 2026

  System load:  0.08               Processes:             126
  Usage of /:   12.5% of 47.39GB   Users logged in:       0
  Memory usage: 22%                IPv4 address for eth0: 194.164.150.79
  Swap usage:   0%                 IPv6 address for eth0: 2a02:4780:12:c71a::1

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

8 updates can be applied immediately.
2 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


5 updates could not be installed automatically. For more details,see /var/log/unattended-upgrades/unattended-upgrades.log                   git clone   `https://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@github.com/himanshu263/eCommerce-MDM.git`
86:~# git clone https://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@github.com/himanshu263/eComCloning into 'eCommerce-MDM'...
remote: Write access to repository not granted.
fatal: unable to access 'https:https://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@github.com/himanshu263/eC
ommerce-MDM.git:~# git clone https://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@github.com/himanshu263/eComCloning into 'eCommerce-MDM'...
remote: Write access to repository not granted.
fatal: unable to access 'https://github.com/himanshu263/eCommerce-MDM.git/': The requested URL returned error: 403
root@srv1496286:~# git clone https://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@github.com/himanshu263/eCommerce-MDM.git
Cloning into 'eCommerce-MDM'...
remote: Write access to repository not granted.
fatal: unable to access 'https://github.com/himanshu263/eCommerce-MDM.git/': The requested URL returned error: 403
root@srv1496286:~# `
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

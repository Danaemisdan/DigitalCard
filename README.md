# Digital Card System

A modern web application for managing Premium and Free digital cards, complete with an Admin Dashboard.

## Features

- **Landing Page**: Apply for Premium or Free cards.
- **Application Forms**: 
  - **Premium**: Includes mock payment gateway and detailed uploads.
  - **Free**: Simple application with mandatory referral code.
- **Admin Panel**:
  - **Login**: Secure access point.
  - **Dashboard**: View applications, revenue stats, and filter records.

## Tech Stack

- React (Vite)
- Tailwind CSS
- React Router DOM
- Lucide Icons

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Admin Access

Navigate to `/admin/login` to access the admin panel.
(Mock login - click "Sign In" to proceed).

## Project Structure

- `src/pages`: Main page components.
- `src/components`: Reusable UI components (Layout, FileUpload).
- `src/services`: Mock data service.

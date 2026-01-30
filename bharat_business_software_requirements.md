# Bharat Business Software – Functional Requirements

## 1. Front Page (Landing Page)
The front page will serve as the entry point for users, displaying two primary Call-to-Action (CTA) buttons:
- **Apply for Premium Card**
- **Apply for Free Card**

Each button will redirect the user to its respective application form.

## 2. Premium Card Application Flow

### Step 1: Application Form
When a user clicks on *Apply for Premium Card*, they will be redirected to a form collecting the following details:
- **Personal Details:**
  - Full Name
  - Email Address
  - Mobile Number
- **Document Uploads:**
  - Aadhaar Card
  - PAN Card
  - Passport-size Photograph
- **Other:**
  - Referral Code (Optional)

### Step 2: Payment
- User is redirected to a payment gateway to pay the premium card fee.
- Payment must be successful to proceed.

### Step 3: Card Generation & Delivery
Upon successful payment:
1. **Auto-generation:** The Premium Card is automatically generated.
2. **Instant Download:** User can download the card immediately from the confirmation screen.
3. **Email Confirmation:** An email is sent containing:
   - Card details
   - Download link (or attachment)
   - Transaction confirmation

## 3. Free Card Application Flow

### Step 1: Application Form
When a user clicks on *Apply for Free Card*, they are redirected to a form collecting:
- **Personal Details:**
  - Full Name
  - Email Address
  - Mobile Number
- **Document Uploads:**
  - Aadhaar Card
  - PAN Card
  - Passport-size Photograph
- **Other:**
  - **Referral Code (Mandatory)**

### Step 2: Card Generation
- **No Payment Required.**
- **Auto-generation:** The Free Card is automatically generated upon submission.
- **Instant Download:** User can download the card immediately.
- **Email Confirmation:** An email is sent with card details and download access.

## 4. Admin Panel (Backend System)
A secure Admin Dashboard will be developed with the following capabilities:

### 4.1 Card & User Management
- **View Applications:** See all card applications (Premium & Free).
- **User Details:** View complete details including uploaded documents.
- **Download Cards:** Admin can download generated cards.
- **Manual Issuance:** Manually create a user and issue a card from the panel.
- **Filter/Search Records By:**
  - Card type
  - Date
  - User name
  - Mobile number
  - Referral code

### 4.2 Role-Based Access Control
- **User Management:** Admin can create multiple backend users (e.g., Support Managers, Employees).
- **Permissions:**
  - Full access (Admin)
  - Premium card data only
  - Free card data only
  - View-only access
- **Example Usage:** A Support Manager can assign an employee limited permissions (e.g., restrict access only to Premium Card records).

## 5. Notifications & Security (Optional but Recommended)
- **Email Notifications:**
  - Card application submission
  - Payment success (Premium card)
  - Card generation
- **Security:**
  - Secure data storage for Aadhaar and PAN uploads.
  - Admin login with authentication and permission control.

## 6. Analytics Dashboard
- Add an analytics dashboard to track:
  - System usage
  - Application metrics
  - Financial data (if applicable)

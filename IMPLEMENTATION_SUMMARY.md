# Season-Specific Cookie Request Page Implementation Summary

## What Was Implemented

### Database Changes
1. **Migration `20251205220319_add_girl_request_form_features.sql`**:
   - Added `publish_girl_request_form` boolean column to `seasons` table (default: false)
   - Added `email` text column to `sellers` table  
   - Created `seller_requests` PostgreSQL view that exposes `id`, `first_name`, and `season` for sellers in published seasons
   - Added RLS policy to allow public (anon) SELECT on `cookies` table when season has published form
   - Added RLS policy to allow public (anon) INSERT on `orders` table with status='requested', type='T2G', and valid seller ID
   - Granted SELECT permission on `seller_requests` view to anon role

### Schema Updates
1. **01-seasons.sql**: Added `publish_girl_request_form` column definition
2. **02-sellers.sql**: Added `email` column definition and `seller_requests` view
3. **02-cookies.sql**: Added public SELECT policy for request forms
4. **03-orders.sql**: Added public INSERT policy for cookie requests

### UI Components
1. **SeasonDialog.vue**: Added toggle switch for `publish_girl_request_form` setting
2. **GirlList.vue**: Added email input field to Girl Details dialog

### Public Request Page
1. **pages/request.vue**: Created new public page accessible at `/request?id=[girl_id]`
   - Uses login layout (no authentication required)
   - Validates `id` query parameter - redirects to login if missing or invalid
   - Fetches seller info from `seller_requests` view
   - Displays seller's first name
   - Loads cookies for the season dynamically
   - Form with FormKitSchema approach:
     - Type field hidden (always 'T2G')
     - "Date Needed" field (renamed from "Order Date")
     - Dynamic cookie quantity fields
     - Notes field
   - Submits order with status='requested'
   - Success confirmation with option to submit another request

### Configuration
1. **nuxt.config.ts**: Updated Supabase redirect options to exclude `/request` page from authentication

## What Needs To Be Done

### Email Functionality (Requirements #13 & #14)
Email functionality is outlined in `supabase/migrations/TODO_email_functionality.sql` but not implemented. This requires:

1. **Email Service Setup**: Configure email service (SendGrid, Resend, etc.)

2. **Email on Cookie Request Submission**:
   - Send email to girl's email address (from sellers.email) if it exists
   - Send email to season owner's email address (from profiles table via seasons.profile)
   - Email template should include: order details, cookies requested, date needed

3. **Email on Order Status Change**:
   - Trigger when any order's status column changes
   - Send to girl's email address if it exists
   - Email template should include: order ID, old status, new status, order details

4. **Implementation Options**:
   - **Option A**: Supabase Edge Functions (recommended)
   - **Option B**: Database triggers with pg_notify
   - **Option C**: Supabase Database Webhooks

### Optional Enhancements

1. **Password Protection**: The title mentions "password protected" but it's not in the detailed requirements. If needed:
   - Add `girl_request_form_password` text column to seasons table
   - Add password input to request page
   - Validate password before showing form
   - Hash/encrypt password in database

2. **Hide TXN# Field**: Requirement #11 mentions hiding the "TXN#" field. Since the request form uses a custom schema (not the full transactionDialogFormSchema), this is already satisfied.

3. **Request Management UI**: Add UI for authenticated users to:
   - View pending cookie requests
   - Approve/reject requests
   - Change request status
   - View request history

4. **Validation**:
   - Prevent duplicate requests
   - Add rate limiting
   - Validate cookie quantities (min/max)
   - Ensure at least one cookie is requested

5. **User Experience**:
   - Add loading states for form submission
   - Better error handling and user feedback
   - Email validation for seller email field
   - Preview of request before submission

## Testing Checklist

To test the implemented features:

1. **Database Setup**: Run the migration on your Supabase database
2. **Season Configuration**:
   - Create/edit a season
   - Enable "Publish Girl Request Form" toggle
3. **Girl/Seller Setup**:
   - Add girls to the season
   - Add email addresses to girl records (optional for testing)
4. **Access Request Page**:
   - Navigate to `/request?id=[girl_id]` where girl_id is ID of a girl in a published season
   - Should see request form with girl's first name
5. **Submit Request**:
   - Fill out date needed
   - Enter cookie quantities
   - Add notes
   - Submit form
   - Should see success message
6. **Verify Database**:
   - Check orders table for new record with status='requested' and type='T2G'
7. **Test Redirects**:
   - Access `/request` without id parameter - should redirect to login
   - Access `/request?id=999` with invalid id - should redirect to login
   - Access `/request?id=X` where X is girl in unpublished season - should redirect to login

## Notes

- The request page is publicly accessible without authentication
- RLS policies ensure only valid requests can be inserted
- The seller_requests view only exposes minimal information (id, first_name, season)
- The form uses FormKitSchema for consistency with the rest of the application
- All changes are minimal and surgical to existing code

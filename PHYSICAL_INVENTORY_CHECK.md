# Physical Inventory Check Feature

## Overview

The Physical Inventory Check feature allows volunteers to perform periodic checks of their physical cookie inventory and compare it against the digital records in Cookie Sanity. This feature is designed to be mobile-friendly and quick enough for daily use.

## Features

### 1. Easy Physical Count Entry
- Count full cases (12 packages each) and individual packages separately
- No mental math required - the app automatically calculates total packages
- Mobile-friendly interface for quick data entry
- Auto-fills the "Conducted By" field with the current user's name

### 2. Automatic Discrepancy Detection
- Compares physical inventory against expected inventory from completed transactions
- Calculates total discrepancies automatically
- Shows variance for each cookie type
- Highlights discrepancies with severity indicators (success/warning/danger)

### 3. Check History
- Records each inventory check with timestamp
- Shows who conducted each check
- Displays total discrepancies for quick assessment
- Allows viewing and deleting historical checks

### 4. Only Completed Transactions Count
- Calculations only include transactions with "complete" status
- Pending and requested transactions are excluded from expected inventory
- Ensures accuracy by comparing against actual received inventory

### 5. Virtual Cookies Excluded
- Virtual cookies (non-physical inventory items) are automatically excluded
- Only physical cookie types appear in the check interface
- Maintains accurate physical inventory counts

## Database Schema

### inventory_checks Table

```sql
CREATE TABLE "public"."inventory_checks" (
    "id" bigint PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now(),
    "profile" uuid NOT NULL,
    "season" bigint NOT NULL,
    "check_date" timestamp with time zone DEFAULT now(),
    "conducted_by" text,
    "physical_inventory" jsonb NOT NULL,
    "expected_inventory" jsonb NOT NULL,
    "discrepancies" jsonb NOT NULL,
    "total_discrepancies" integer DEFAULT 0,
    "status" text DEFAULT 'completed',
    "notes" text,
    FOREIGN KEY (profile) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (season) REFERENCES seasons(id) ON DELETE CASCADE
);
```

### Data Structure

- **physical_inventory**: JSON object with cookie abbreviations as keys and total package counts as values
  - Example: `{"TM": 100, "SM": 50, "CB": 75}`
  
- **expected_inventory**: JSON object with expected package counts based on completed transactions
  - Example: `{"TM": 105, "SM": 48, "CB": 75}`
  
- **discrepancies**: JSON object with the difference (physical - expected) for each cookie type
  - Example: `{"TM": -5, "SM": 2, "CB": 0}`

## UI Components

### Main Page (`/physical-inventory-check`)

The main page displays:
- Header with title and description
- Last check summary (if available)
  - Date and time of last check
  - Who conducted it
  - Status and total discrepancies
  - Number of items checked
- "Start Physical Check" button
- "View History" button

### Physical Check Dialog

The check dialog includes:
- Form fields:
  - Conducted By (auto-populated with current user)
  - Date (auto-populated with current date)
  - Cookie counts for each non-virtual cookie:
    - Cases input (number of full 12-package cases)
    - Individual packages input (0-11 packages)
    - Calculated total display
  - Notes field (optional)
- Action buttons:
  - Cancel (closes dialog without saving)
  - Save Check (calculates discrepancies and saves to database)

### History Dialog

The history dialog shows a data table with:
- Check Date
- Conducted By
- Status
- Items Checked
- Total Discrepancies (with severity tags)
- Notes
- Actions (view details, delete)

## Code Structure

### Store: `stores/inventoryChecks.ts`

Key methods:
- `fetchInventoryChecks()`: Loads all checks for current profile/season
- `insertInventoryCheck()`: Saves a new inventory check
- `deleteInventoryCheck()`: Removes a check from history
- `calculateExpectedInventory()`: Gets expected inventory from completed transactions
- `calculateDiscrepancies()`: Compares physical vs. expected and calculates variances

Computed properties:
- `sortedInventoryChecks`: Checks sorted by date (newest first)
- `latestInventoryCheck`: Most recent check

### Page Component: `pages/physical-inventory-check.vue`

Implements:
- Main layout with summary cards
- Dialog for entering physical counts
- Dialog for viewing check history
- Form handling and data submission
- Integration with inventory checks store

### Types: `types/types.ts` and `types/supabase.ts`

Added `InventoryCheck` type with full TypeScript support for:
- Database row structure
- Insert operations
- Update operations
- Type-safe access to all fields

## Usage Flow

1. **Start a Check**:
   - User clicks "Start Physical Check"
   - Dialog opens with form pre-populated
   - User counts physical inventory

2. **Enter Counts**:
   - For each cookie type:
     - Enter number of full cases
     - Enter number of individual packages
     - View calculated total

3. **Save Check**:
   - User adds optional notes
   - Clicks "Save Check"
   - App calculates expected inventory from completed transactions
   - App calculates discrepancies
   - Check is saved to database
   - Success notification shown

4. **View Results**:
   - Main page shows summary of latest check
   - Status indicator shows if inventory matches
   - Total discrepancies displayed prominently

5. **Review History**:
   - User clicks "View History"
   - Table shows all past checks
   - User can view details or delete old checks

## Testing

The feature includes comprehensive unit tests (`stores/inventoryChecks.test.ts`) covering:
- State initialization
- Computed properties
- Expected inventory calculation
- Discrepancy calculation with various scenarios
- Active check management

All 12 tests pass successfully.

## Mobile Considerations

The interface is designed to be mobile-friendly:
- Large touch targets for number inputs
- Clear visual hierarchy
- Responsive grid layout
- Full-width dialogs on mobile
- Touch-friendly buttons and controls

## Future Enhancements

Potential improvements:
- Export check history to CSV/PDF
- Trends and analytics over time
- Automatic reconciliation suggestions
- Integration with transaction creation (auto-create adjustment transactions)
- Scheduled check reminders
- Photo documentation of physical inventory
- Barcode scanning for cookie cases

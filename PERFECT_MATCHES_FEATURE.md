# Perfect Matches Feature Documentation

## Overview
The Perfect Matches feature allows volunteers to view audit rows from uploaded Smart Cookies files that exactly match orders in the Cookie Sanity database. This comparison is performed server-side for efficiency and accuracy.

## Architecture

### Server-Side API Endpoint
**File:** `/server/api/audit/perfect-matches.post.ts`

The endpoint accepts a POST request with:
- `auditSessionId`: The ID of the audit session to analyze
- `seasonId`: The current season ID for filtering orders, sellers, and cookies

**Matching Criteria:**
1. **Date Match:** `audit_row.DATE == order.order_date` (normalized to YYYY-MM-DD format)
2. **Type Match:** `audit_row.TYPE == order.type`
3. **Seller Match:** `audit_row.TO or FROM == seller.first_name + " " + seller.last_name` where `seller.id == order.to`
4. **Cookie Quantities Match:** For each cookie abbreviation in the current season, `audit_row[abbreviation] == order.cookies[abbreviation]`

**Response:**
```typescript
{
  matches: Array<{
    auditRow: Record<string, unknown>,
    order: Order,
    seller: Seller
  }>,
  totalAuditRows: number,
  totalOrders: number,
  matchCount: number
}
```

### Store Updates
**File:** `/stores/auditSessions.ts`

Added:
- `perfectMatches` - ref to store matched records
- `perfectMatchesLoading` - ref to track loading state
- `fetchPerfectMatches()` - action to call the API endpoint

### UI Components

#### AuditPerfectMatchesDataTable Component
**File:** `/components/audit/AuditPerfectMatchesDataTable.vue`

Features:
- Displays perfect matches in a PrimeVue DataTable
- Shows match summary with count and percentage
- Includes standard columns: Row #, Date, Type, Seller, Order #
- Dynamically displays cookie columns based on season configuration
- Handles loading state with ProgressSpinner
- Shows informative messages when no data or no matches

#### Updated Audit Page
**File:** `/pages/audit.vue`

Changes:
- Added TabView with two tabs:
  - "All Rows" - Shows all uploaded data (existing AuditRowsDataTable)
  - "Perfect Matches" - Shows only matching records (new AuditPerfectMatchesDataTable)
- TabView only appears when an audit session exists
- Falls back to showing just AuditRowsDataTable when no session is uploaded

## Testing

### Component Tests
**File:** `/components/audit/AuditPerfectMatchesDataTable.test.ts`
- 8 comprehensive tests covering:
  - Component rendering
  - Empty states
  - Loading states
  - Data display
  - Match statistics

### Store Tests
**File:** `/stores/auditSessions.test.ts`
- Added 6 tests for `fetchPerfectMatches` action:
  - Successful fetch
  - Loading state management
  - Error handling
  - Empty session handling
  - Season validation

### Page Tests
**File:** `/pages/audit.test.ts`
- Updated 6 existing tests to include new components
- Added mocking for TabView components

## Usage

1. **Upload an audit file** using the AuditFileUpload component
2. **Navigate to Perfect Matches tab** to see matched records
3. **Review summary statistics** showing match count and percentage
4. **Inspect matched rows** in the DataTable with full details

## Technical Details

### Performance Considerations
- Server-side processing reduces client-side computation
- Efficient database queries with proper indexing
- Results cached in store until new audit session is uploaded

### Data Flow
1. User uploads audit file → stored in `audit_sessions` table
2. User switches to Perfect Matches tab → triggers `fetchPerfectMatches()`
3. API fetches audit session, orders, sellers, and cookies from database
4. Server performs matching logic and returns results
5. Results displayed in DataTable with formatting

### Security
- Authentication required via `serverSupabaseUser`
- Row Level Security policies ensure users only see their own data
- Input validation on API endpoint

## Future Enhancements

Potential improvements:
- Export perfect matches to CSV
- Show discrepancies for near-matches
- Bulk actions on matched records
- Historical match tracking
- Match confidence scoring

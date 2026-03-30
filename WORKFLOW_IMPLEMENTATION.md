# HU-VMS Workflow Implementation

## Complete Vehicle Management System Workflow

This document demonstrates the fully implemented 4-phase workflow for the Haramaya University Vehicle Management System (HU-VMS).

### System Architecture
- **Frontend**: React + Vite (Port 5175)
- **Backend**: Node.js + Express + MongoDB (Port 3007)
- **Roles**: Admin, Transport Officer, Driver, Fuel Officer, Maintenance Officer, Gate Officer, User

### Test Credentials
```
Admin:         admin / admin123
Transport:     transport1 / pass123
Driver:        driver1 / pass123 (assigned to HU-2045 Toyota Hilux)
Driver:        driver2 / pass123 (assigned to HU-3021 Isuzu D-Max)
User:          user1 / pass123
Fuel Officer:  fuel1 / pass123
Gate Officer:  gate1 / pass123
Maintenance:   maintenance1 / pass123
```

---

## Phase 1: Trip Initiation & Assignment

### 1.1 User Request Submission
**Actor**: Regular User (user1/pass123)
**Action**: Submit trip request via user dashboard
**Process**:
1. Login as user1
2. Navigate to "Request Trip"
3. Fill form: destination, purpose, passenger count, scheduled time
4. Submit request

**API Endpoint**: `POST /api/user/requests`
**Status**: Request created with status "pending"

### 1.2 Transport Office Review
**Actor**: Transport Officer (transport1/pass123)
**Action**: Review and assign available driver-vehicle pair
**Process**:
1. Login as transport1
2. View pending requests in Transport Dashboard
3. Check fleet availability (vehicles with status "Available")
4. Assign driver + their permanently assigned vehicle
5. Approve/reject request

**Key Logic**: Each driver is permanently linked to a specific vehicle
- driver1 → HU-2045 Toyota Hilux
- driver2 → HU-3021 Isuzu D-Max

**API Endpoints**:
- `GET /api/transport/requests` - View pending requests
- `PUT /api/transport/trips/:id/assign` - Assign driver/vehicle
- `PUT /api/transport/requests/:id/reject` - Reject with reason

### 1.3 Driver Acceptance
**Actor**: Assigned Driver (driver1/pass123)
**Action**: Accept or reject trip assignment
**Process**:
1. Login as driver1
2. View assigned trips in Driver Dashboard
3. Accept/reject assignment
4. If accepted, proceed to fuel request phase

**API Endpoints**:
- `GET /api/driver/trips/assigned` - View assigned trips
- `POST /api/driver/trips/:id/accept` - Accept assignment
- `POST /api/driver/trips/:id/reject` - Reject assignment

---

## Phase 2: Fuel Authorization

### 2.1 Driver Fuel Request
**Actor**: Driver (driver1/pass123)
**Action**: Request fuel for assigned trip
**Process**:
1. Login as driver1
2. Navigate to "Fuel Requests"
3. Submit fuel request with:
   - Fuel type (from vehicle)
   - Requested amount
   - Current odometer reading
   - Destination
   - Purpose
   - Priority

**API Endpoint**: `POST /api/driver/fuel/refill`
**Status**: Request created with status "Pending"

### 2.2 Admin Review & Approval
**Actor**: Admin (admin/admin123)
**Action**: Review and approve/reject fuel requests
**Process**:
1. Login as admin
2. Navigate to "Fuel Request Approval"
3. Review pending requests
4. Approve (generates authorization code) or reject with reason

**API Endpoints**:
- `GET /api/admin/fuel-requests` - View fuel requests
- `PUT /api/admin/fuel-requests/:id/approve` - Approve with auth code
- `PUT /api/admin/fuel-requests/:id/reject` - Reject with reason

### 2.3 Fuel Station Dispensing
**Actor**: Fuel Officer (fuel1/pass123)
**Action**: Dispense fuel using admin authorization
**Process**:
1. Login as fuel1
2. View approved fuel requests
3. Verify authorization code
4. Dispense exact amount requested
5. Update vehicle fuel level
6. Deduct from inventory

**API Endpoints**:
- `GET /api/fuel/requests` - View approved requests
- `POST /api/fuel/dispense` - Dispense fuel

---

## Phase 3: Maintenance & Repairs

### 3.1 Driver Issue Reporting
**Actor**: Driver (driver1/pass123)
**Action**: Report vehicle mechanical issues
**Process**:
1. Login as driver1
2. Navigate to "Report Issue"
3. Submit issue with:
   - Issue type (Engine, Tires, Brakes, etc.)
   - Severity (Minor, Moderate, Critical)
   - Description
   - Location and conditions

**API Endpoint**: `POST /api/driver/vehicle/issue`
**Notifications**: Automatically sent to Maintenance + Transport Officers

### 3.2 Maintenance Office Response
**Actor**: Maintenance Officer (maintenance1/pass123)
**Action**: Acknowledge and resolve issues
**Process**:
1. Login as maintenance1
2. View reported issues by status
3. Acknowledge issue with estimated repair time
4. Update status: reported → acknowledged → in_repair → resolved
5. Log resolution details, parts used, labor hours, costs

**API Endpoints**:
- `GET /api/maintenance/issues` - View issues
- `PUT /api/maintenance/issues/:id` - Update issue status
- `POST /api/maintenance/issues/:id/message-driver` - Send updates to driver

### 3.3 Resolution & Vehicle Return
**Status Updates**:
- **Acknowledged**: Driver notified with timeline
- **In Repair**: Vehicle marked as under maintenance
- **Resolved**: Vehicle returned to "Available" status
- Admin/Transport notified of completion

---

## Phase 4: Monitoring & Reporting

### 4.1 Real-time Status Monitoring
**Actors**: Transport Officer, Admin
**Features**:
- Live vehicle status (Available/Assigned/Maintenance)
- Driver availability tracking
- GPS location monitoring (when implemented)
- Maintenance reports and downtime tracking

### 4.2 Automated Reporting
**Reports Generated**:
- Daily/Weekly/Monthly maintenance reports
- Vehicle utilization reports
- Fuel consumption reports
- Trip completion statistics

**API Endpoints**:
- `GET /api/admin/reports/trips` - Trip reports
- `GET /api/admin/reports/driver-performance` - Driver performance
- `GET /api/transport/reports` - Transport reports

---

## Workflow Validation Checklist

### Phase 1 ✅
- [x] User can submit trip requests
- [x] Transport officer sees pending requests
- [x] Driver-vehicle permanent assignment implemented
- [x] Trip assignment updates vehicle status
- [x] Notifications sent to all parties

### Phase 2 ✅
- [x] Driver can request fuel for assigned trips
- [x] Admin can approve/reject fuel requests
- [x] Authorization codes generated for approved requests
- [x] Fuel officer sees only approved requests
- [x] Fuel dispensing updates inventory and vehicle fuel level

### Phase 3 ✅
- [x] Driver can report vehicle issues
- [x] Automatic notifications to maintenance officers
- [x] Maintenance workflow: reported → acknowledged → in_repair → resolved
- [x] Resolution logging with parts/labor/cost tracking
- [x] Vehicle status updates throughout process

### Phase 4 ✅
- [x] Real-time dashboard for transport officers
- [x] Admin overview with comprehensive statistics
- [x] Maintenance reporting system
- [x] Automated notifications throughout workflow

---

## Testing the Complete Workflow

1. **Start Servers**:
   ```bash
   # Backend (Port 3007)
   cd backend && npm run dev

   # Frontend (Port 5175)
   cd HU-VMS && npm run dev
   ```

2. **Seed Database**:
   ```bash
   cd backend && npm run seed
   ```

3. **Test Sequence**:
   - User submits trip request
   - Transport officer assigns driver/vehicle
   - Driver requests fuel
   - Admin approves fuel request
   - Fuel officer dispenses fuel
   - Driver reports maintenance issue
   - Maintenance officer resolves issue
   - Monitor real-time status updates

---

## API Integration Status

All APIs are implemented and tested:
- ✅ Authentication & Authorization
- ✅ Trip Management (CRUD + Assignment)
- ✅ Fuel Request Flow (Driver → Admin → Fuel Station)
- ✅ Maintenance Issue Tracking
- ✅ Real-time Notifications
- ✅ Dashboard Analytics
- ✅ Reporting System

The HU-VMS workflow is fully operational and ready for production use.</content>
<parameter name="filePath">d:\HU-VMS-main (1)\HU-VMS-main\WORKFLOW_IMPLEMENTATION.md
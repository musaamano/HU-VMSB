const router = require('express').Router();
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Request = require('../models/Request');
const SentReport = require('../models/SentReport');
const ReportRequest = require('../models/ReportRequest');
const { authMiddleware } = require('../middleware/auth');

// GET /api/reports/vehicle-usage
router.get('/vehicle-usage', authMiddleware, async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    // Count trips per vehicle from requests
    const requests = await Request.find({ status: { $in: ['approved', 'completed'] } });

    const data = vehicles.map(v => {
      const trips = requests.filter(r => r.assignedVehicle === v.plateNumber).length;
      return {
        model: v.model,
        plateNumber: v.plateNumber,
        type: v.type,
        capacity: v.capacity,
        status: v.status,
        trips,
        mileage: `${v.mileage} km`,
        fuelLevel: `${v.fuelLevel}%`,
        driver: v.assignedDriverName || 'Unassigned',
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports/driver-activity
router.get('/driver-activity', authMiddleware, async (req, res) => {
  try {
    const drivers = await Driver.find();
    const requests = await Request.find({ status: { $in: ['approved', 'completed'] } });

    const data = drivers.map(d => {
      const trips = requests.filter(r => r.assignedDriver === d.name).length;
      return {
        name: d.name,
        employeeId: d.employeeId || 'N/A',
        phone: d.phone || 'N/A',
        licenseNumber: d.licenseNumber || 'N/A',
        status: d.status,
        assignedVehicle: d.assignedVehiclePlate || 'None',
        totalTrips: d.totalTrips + trips,
        rating: d.rating,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports/requests-summary
router.get('/requests-summary', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    const data = requests.map(r => ({
      requester: r.requester,
      department: r.department,
      destination: r.destination,
      date: r.date,
      passengers: r.passengers,
      priority: r.priority,
      status: r.status,
      assignedVehicle: r.assignedVehicle || 'N/A',
      assignedDriver: r.assignedDriver || 'N/A',
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

// POST /api/reports/send — admin sends a report to an officer
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { reportType, reportName, sentTo, data, columns } = req.body;
    const report = new SentReport({
      reportType,
      reportName,
      sentTo,
      sentBy: req.user?.name || 'Admin',
      data,
      columns,
    });
    await report.save();
    res.status(201).json({ message: 'Report sent', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports/received — officer fetches reports sent to them
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const username = req.user?.username || req.query.username;
    const reports = await SentReport.find({ sentTo: username }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/reports/request — officer submits a report request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { reportType, period, message } = req.body;
    const rr = new ReportRequest({
      reportType,
      period,
      message,
      requestedBy: req.user.username || req.user.name,
      requestedByName: req.user.name,
    });
    await rr.save();
    res.status(201).json({ message: 'Report request submitted', request: rr });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports/requests — admin fetches all pending report requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await ReportRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/reports/requests/:id — admin updates status (resolved/rejected)
router.patch('/requests/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await ReportRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const { sendError } = require('../utils/response');
const pool = require('../config/database');
const { htmlPage, taka, formatDate } = require('../utils/exporters');

const loadTrip = async (id) => {
  const tripResult = await pool.query(`
    SELECT t.*, v.registration_number, v.vehicle_type, COALESCE(o.name, v.owner_name) AS owner_name,
      d.name AS driver_name, d.phone_number AS driver_phone, d.license_number
    FROM trips t
    JOIN vehicles v ON v.id = t.vehicle_id
    JOIN drivers d ON d.id = t.driver_id
    LEFT JOIN owners o ON o.id = v.owner_id
    WHERE t.id = $1
  `, [id]);

  if (!tripResult.rows.length) return null;
  const trip = tripResult.rows[0];
  const [expensesResult, paymentsResult] = await Promise.all([
    pool.query('SELECT * FROM expenses WHERE trip_id = $1 ORDER BY date DESC', [id]),
    pool.query('SELECT * FROM payments WHERE trip_id = $1 ORDER BY date DESC', [id]),
  ]);
  trip.expenses = expensesResult.rows;
  trip.payments = paymentsResult.rows;
  trip.totalExpenses = expensesResult.rows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  trip.totalPayments = paymentsResult.rows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  trip.dueAmount = Math.max(0, parseFloat(trip.fare_amount || 0) - parseFloat(trip.advance_payment || 0) - trip.totalPayments);
  return trip;
};

const invoice = async (req, res) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return sendError(res, 'Trip not found', 404);

    const paymentRows = trip.payments.map((p) => `<tr><td>${formatDate(p.date)}</td><td>${p.payment_method || ''}</td><td class="right">${taka(p.amount)}</td></tr>`).join('') || '<tr><td colspan="3">No payment recorded</td></tr>';
    const body = `
      <div class="header">
        <div><h1>Customer Invoice</h1><div class="muted">Truck & Vehicle Business Management System</div></div>
        <div class="right"><span class="badge">${trip.status}</span><div class="muted">Invoice Date: ${formatDate(new Date())}</div></div>
      </div>
      <div class="grid">
        <div class="box"><h3>Bill To</h3><div>${trip.customer_name}</div><div class="muted">Route: ${trip.loading_point || '-'} to ${trip.unloading_point || '-'}</div></div>
        <div class="box"><h3>Trip Info</h3><div>Vehicle: ${trip.registration_number}</div><div>Driver: ${trip.driver_name} (${trip.driver_phone || '-'})</div><div>Date: ${formatDate(trip.trip_date)}</div></div>
      </div>
      <table>
        <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
        <tbody>
          <tr><td>Trip Fare</td><td class="right">${taka(trip.fare_amount)}</td></tr>
          <tr><td>Advance Payment</td><td class="right">${taka(trip.advance_payment)}</td></tr>
          <tr><td>Additional Payments</td><td class="right">${taka(trip.totalPayments)}</td></tr>
          <tr><th>Due Amount</th><th class="right total">${taka(trip.dueAmount)}</th></tr>
        </tbody>
      </table>
      <h3 style="margin-top:24px">Payment History</h3>
      <table><thead><tr><th>Date</th><th>Method</th><th class="right">Amount</th></tr></thead><tbody>${paymentRows}</tbody></table>
      <p class="muted">This is a system generated invoice. Please verify payment before final settlement.</p>
    `;
    res.send(htmlPage({ title: `Invoice ${trip.customer_name}`, body }));
  } catch (error) {
    console.error('Invoice error:', error);
    sendError(res, 'Failed to generate invoice', 500);
  }
};

const challan = async (req, res) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return sendError(res, 'Trip not found', 404);

    const body = `
      <div class="header">
        <div><h1>Trip Challan</h1><div class="muted">Truck & Vehicle Business Management System</div></div>
        <div class="right"><span class="badge">${trip.status}</span><div class="muted">Generated: ${formatDate(new Date())}</div></div>
      </div>
      <div class="grid">
        <div class="box"><h3>Vehicle</h3><div>Number: ${trip.registration_number}</div><div>Type: ${trip.vehicle_type || '-'}</div><div>Owner: ${trip.owner_name || '-'}</div></div>
        <div class="box"><h3>Driver</h3><div>Name: ${trip.driver_name}</div><div>Phone: ${trip.driver_phone || '-'}</div><div>License: ${trip.license_number || '-'}</div></div>
        <div class="box"><h3>Route</h3><div>Loading: ${trip.loading_point || '-'}</div><div>Unloading: ${trip.unloading_point || '-'}</div><div>Date: ${formatDate(trip.trip_date)}</div></div>
        <div class="box"><h3>Customer</h3><div>${trip.customer_name}</div><div>Fare: ${taka(trip.fare_amount)}</div><div>Advance: ${taka(trip.advance_payment)}</div></div>
      </div>
      <table>
        <thead><tr><th>Instruction</th><th>Signature</th></tr></thead>
        <tbody><tr><td>Goods loaded and trip started as per customer instruction.</td><td style="height:70px"></td></tr></tbody>
      </table>
      <p class="muted">Keep one copy with the driver and one copy for office records.</p>
    `;
    res.send(htmlPage({ title: `Challan ${trip.customer_name}`, body }));
  } catch (error) {
    console.error('Challan error:', error);
    sendError(res, 'Failed to generate challan', 500);
  }
};

module.exports = { invoice, challan };

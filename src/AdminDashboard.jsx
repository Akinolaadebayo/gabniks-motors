import { useEffect, useState } from "react";
import { supabase } from "./libs/supabaseClient";

/* =========================================================
   ADMIN DASHBOARD COMPONENT
   Project: Gabniks Motors
   Developer: Ami Adebayo
   Role: Senior Developer / Senior Design Developer

   Purpose:
   - Allows admin users to view service requests.
   - Allows admin users to view customer profiles.
   - Allows admin users to update booking request status.
   - Adds professional refresh button interaction.
   - Uses Supabase Row Level Security.
   - Does not expose the Supabase service_role secret key.
========================================================= */

function AdminDashboard({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");
  const [dashboardMessage, setDashboardMessage] = useState("");

  /* =========================================================
     LOAD DASHBOARD DATA WHEN ADMIN PANEL OPENS
  ========================================================= */

  useEffect(() => {
    loadAdminData();
  }, []);

  /* =========================================================
     FETCH ADMIN DATA
     RLS policies decide whether the logged-in user can read this.
     If profile.role = admin, data should load.
  ========================================================= */

  const loadAdminData = async () => {
    setLoading(true);
    setDashboardMessage("");

    const { data: requestsData, error: requestsError } = await supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestsError || profilesError) {
      console.error("Admin dashboard loading error:", {
        requestsError,
        profilesError,
      });

      setDashboardMessage(
        "Unable to load admin data. Confirm this account has role = admin in the profiles table."
      );

      setServiceRequests([]);
      setCustomers([]);
      setLoading(false);
      return;
    }

    setServiceRequests(requestsData || []);
    setCustomers(profilesData || []);
    setLoading(false);
  };

  /* =========================================================
     PROFESSIONAL REFRESH HANDLER
     Purpose:
     Gives the admin refresh button a real loading feel.
     The short delay prevents the button from flashing too fast.
  ========================================================= */

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await Promise.all([
        loadAdminData(),
        new Promise((resolve) => setTimeout(resolve, 650)),
      ]);

      setDashboardMessage("Dashboard refreshed successfully.");
    } finally {
      setIsRefreshing(false);
    }
  };

  /* =========================================================
     UPDATE BOOKING STATUS
     Admin can change request status from the dashboard.
  ========================================================= */

  const updateRequestStatus = async (requestId, newStatus) => {
    setDashboardMessage("");

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: newStatus,
        request_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Status update error:", error);
      setDashboardMessage("Unable to update request status.");
      return;
    }

    setServiceRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: newStatus,
              request_status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : request
      )
    );

    setDashboardMessage("Request status updated successfully.");
  };

  /* =========================================================
     FORMAT VEHICLE DETAILS
     Purpose:
     Vehicle information belongs to service requests, not the
     customer account profile.
  ========================================================= */

  const formatVehicle = (item) => {
    const vehicle = [
      item.car_year || item.vehicle_year,
      item.car_make || item.vehicle_make,
      item.car_model || item.vehicle_model,
    ]
      .filter(Boolean)
      .join(" ");

    return vehicle || "Not provided";
  };

  /* =========================================================
     FORMAT CUSTOMER ADDRESS
     Purpose:
     Customer profile should focus on user contact details.
  ========================================================= */

  const formatContactAddress = (customer) => {
    return (
      customer.contact_address ||
      customer.address ||
      customer.city ||
      "Not provided"
    );
  };

  return (
    <div className="admin-dashboard-overlay">
      <div className="admin-dashboard">
        {/* =====================================================
            ADMIN HEADER
        ===================================================== */}

        <div className="admin-dashboard-header">
          <div>
            <p className="admin-dashboard-label">ADMIN CONTROL</p>
            <h2>Gabniks Motors Dashboard</h2>
            <p>
              Manage customer bookings, customer profiles, and service request
              status from one secure business dashboard.
            </p>
          </div>

          <button
            className="admin-close-button"
            type="button"
            onClick={onClose}
            aria-label="Close admin dashboard"
          >
            ×
          </button>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="admin-summary-grid">
          <div className="admin-summary-card">
            <span>Total Requests</span>
            <strong>{serviceRequests.length}</strong>
          </div>

          <div className="admin-summary-card">
            <span>Total Customers</span>
            <strong>{customers.length}</strong>
          </div>

          <div className="admin-summary-card">
            <span>New Requests</span>
            <strong>
              {
                serviceRequests.filter((request) => {
                  const status = String(
                    request.request_status || request.status || ""
                  ).toLowerCase();

                  return (
                    !status ||
                    status === "new" ||
                    status === "pending"
                  );
                }).length
              }
            </strong>
          </div>
        </div>

        {/* =====================================================
            TABS
        ===================================================== */}

        <div className="admin-tabs">
          <button
            type="button"
            className={
              activeTab === "requests" ? "admin-tab active" : "admin-tab"
            }
            onClick={() => setActiveTab("requests")}
          >
            Service Requests
          </button>

          <button
            type="button"
            className={
              activeTab === "customers" ? "admin-tab active" : "admin-tab"
            }
            onClick={() => setActiveTab("customers")}
          >
            Customers
          </button>

          <button
            type="button"
            className={`admin-refresh-button ${
              isRefreshing ? "refreshing" : ""
            }`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <span className="refresh-icon">↻</span>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =====================================================
            DASHBOARD MESSAGE
        ===================================================== */}

        {dashboardMessage && (
          <div
            className={`admin-message ${
              dashboardMessage.includes("successfully")
                ? "success"
                : "warning"
            }`}
          >
            {dashboardMessage}
          </div>
        )}

        {/* =====================================================
            LOADING STATE
        ===================================================== */}

        {loading ? (
          <div className="admin-loading">Loading admin dashboard...</div>
        ) : (
          <>
            {/* =================================================
                SERVICE REQUESTS TABLE
            ================================================= */}

            {activeTab === "requests" && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Urgency</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Vehicle</th>
                      <th>Location</th>
                      <th>Issue</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {serviceRequests.length === 0 ? (
                      <tr>
                        <td colSpan="9">No service requests yet.</td>
                      </tr>
                    ) : (
                      serviceRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.full_name || "Not provided"}</td>
                          <td>{request.selected_service || "Not provided"}</td>
                          <td>{request.service_urgency || "Not provided"}</td>
                          <td>{request.phone || "Not provided"}</td>
                          <td>{request.email || "Not provided"}</td>
                          <td>{formatVehicle(request)}</td>
                          <td>{request.vehicle_location || "Not provided"}</td>
                          <td>{request.issue_description || "Not provided"}</td>
                          <td>
                            <select
                              className="admin-status-select"
                              value={
                                request.request_status ||
                                request.status ||
                                "New"
                              }
                              onChange={(event) =>
                                updateRequestStatus(
                                  request.id,
                                  event.target.value
                                )
                              }
                            >
                              <option value="New">New</option>
                              <option value="Ongoing">Ongoing</option>
                              <option value="Finished">Finished</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* =================================================
                CUSTOMERS TABLE
                Purpose:
                Customer profile is now user-focused:
                name, email, phone, address, contact method, role.
                Vehicle details belong to service bookings.
            ================================================= */}

            {activeTab === "customers" && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Contact Address</th>
                      <th>Contact Method</th>
                      <th>Role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan="6">No customer profiles yet.</td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.full_name || "Not provided"}</td>
                          <td>{customer.email || "Not provided"}</td>
                          <td>{customer.phone || "Not provided"}</td>
                          <td>{formatContactAddress(customer)}</td>
                          <td>
                            {customer.preferred_contact_method ||
                              "Not provided"}
                          </td>
                          <td>{customer.role || "customer"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
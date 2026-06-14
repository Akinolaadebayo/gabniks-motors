// =========================================================
// GABNIKS MOTORS WEBSITE APPLICATION
// Developer: Ami Adebayo
// Role: Senior Developer
//
// Purpose:
// Main React application for Gabniks Motors & Tech LLC.
// Includes public website, customer signup/login,
// Supabase service booking, profile storage,
// profile editing, admin dashboard, request editing,
// payment tracking, schedule urgency highlighting,
// and admin-only delete controls.
// =========================================================

import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./libs/supabaseClient";
import logoImage from "./assets/Gabnik_logo.png";
import heroImage from "./assets/hero.jpg";

// =========================================================
// BUSINESS CONSTANTS
// Purpose:
// Central place to manage business contact links.
// =========================================================

const BUSINESS_PHONE_DISPLAY = "+1 (678) 749-0856";
const BUSINESS_PHONE_LINK = "tel:+16787490856";
const WHATSAPP_LINK = "https://wa.me/16787490856";
const FACEBOOK_LINK = "#";
const FORMSPREE_URL = import.meta.env.VITE_FORMSPREE_URL || "";

const GOOGLE_MAP_EMBED_URL =
  "https://www.google.com/maps?q=Atlanta,%20GA,%20USA&output=embed";

// =========================================================
// SERVICE OPTIONS
// Purpose:
// One source of truth for service cards and admin dropdowns.
// =========================================================

const SERVICES = [
  {
    icon: "🔑",
    title: "Car Key Programming",
    description: "Professional key programming for modern vehicles.",
  },
  {
    icon: "🚗",
    title: "Key Fob Replacement",
    description: "Replacement and setup for lost or damaged key fobs.",
  },
  {
    icon: "🧠",
    title: "ECU Programming",
    description: "Advanced ECU programming and vehicle module support.",
  },
  {
    icon: "🛞",
    title: "TPMS Services",
    description: "Tire pressure sensor programming and replacement.",
  },
  {
    icon: "🔍",
    title: "Car Diagnostics",
    description: "Accurate diagnostics for warning lights and vehicle issues.",
  },
  {
    icon: "🛡️",
    title: "Airbag Services",
    description: "Airbag system scanning and diagnostic support.",
  },
  {
    icon: "🔐",
    title: "Rekey & Lock Change",
    description: "Vehicle lock rekeying and secure lock replacement.",
  },
  {
    icon: "🚘",
    title: "Car Lockout Assistance",
    description: "Fast emergency help when you are locked out.",
  },
];

// =========================================================
// ADMIN OPTIONS
// Purpose:
// Keeps admin edit values consistent.
// =========================================================

const REQUEST_STATUS_OPTIONS = ["New", "Ongoing", "Finished", "Cancelled"];

const PAYMENT_STATUS_OPTIONS = [
  "Unpaid",
  "Deposit Paid",
  "Paid in Full",
  "Refunded",
];

const URGENCY_OPTIONS = [
  "Today",
  "Urgent",
  "Emergency",
  "Flexible appointment",
];

// =========================================================
// FORMATTERS
// Purpose:
// Makes database values readable in the admin dashboard.
// =========================================================

const formatDateTime = (dateValue) => {
  if (!dateValue) return "No date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatAppointment = (dateValue, timeValue) => {
  if (!dateValue) return "No appointment date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Invalid appointment";
  }

  const dateText = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return timeValue ? `${dateText} at ${timeValue}` : dateText;
};

// =========================================================
// SCHEDULE COLOUR HELPER
// Purpose:
// Helps admin quickly see appointment closeness.
// Red = overdue/today
// Amber = 1-3 days away
// Green = 4+ days away
// Gray = no date
// =========================================================

const getScheduleUrgency = (appointmentDate) => {
  if (!appointmentDate) {
    return {
      label: "No date",
      className: "schedule-empty",
    };
  }

  const today = new Date();
  const appointment = new Date(appointmentDate);

  if (Number.isNaN(appointment.getTime())) {
    return {
      label: "Invalid",
      className: "schedule-empty",
    };
  }

  today.setHours(0, 0, 0, 0);
  appointment.setHours(0, 0, 0, 0);

  const differenceInDays = Math.ceil(
    (appointment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (differenceInDays < 0) {
    return {
      label: "Overdue",
      className: "schedule-danger",
    };
  }

  if (differenceInDays === 0) {
    return {
      label: "Today",
      className: "schedule-danger",
    };
  }

  if (differenceInDays <= 3) {
    return {
      label: `${differenceInDays} day(s)`,
      className: "schedule-warning",
    };
  }

  return {
    label: `${differenceInDays} day(s)`,
    className: "schedule-safe",
  };
};

// =========================================================
// BADGE CLASS HELPERS
// Purpose:
// Converts database values into clean visual badges.
// =========================================================

const getRequestStatusClass = (status) => {
  const value = String(status || "New").toLowerCase();

  if (value.includes("finished")) return "status-finished";
  if (value.includes("cancel")) return "status-cancelled";
  if (value.includes("ongoing")) return "status-ongoing";

  return "status-new";
};

const getPaymentStatusClass = (status) => {
  const value = String(status || "Unpaid").toLowerCase();

  if (value.includes("deposit")) return "payment-deposit";
  if (value.includes("full") || value === "paid") return "payment-paid";
  if (value.includes("refund")) return "payment-refunded";

  return "payment-unpaid";
};

const getUrgencyClass = (urgency) => {
  const value = String(urgency || "").toLowerCase();

  if (value.includes("emergency")) return "urgency-emergency";
  if (value.includes("urgent")) return "urgency-urgent";
  if (value.includes("today")) return "urgency-today";

  return "urgency-flexible";
};

// =========================================================
// MAIN APP COMPONENT
// =========================================================

function App() {
  const [session, setSession] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedService, setSelectedService] = useState("");

  const [authMessage, setAuthMessage] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const [profiles, setProfiles] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const [adminFilter, setAdminFilter] = useState("all");
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);

  const [hashRoute, setHashRoute] = useState(window.location.hash);

  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    city: "",
    preferredContactMethod: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [bookingForm, setBookingForm] = useState({
    serviceUrgency: "Flexible appointment",
    fullName: "",
    phone: "",
    email: "",
    carMake: "",
    carModel: "",
    carYear: "",
    vehicleLocation: "",
    appointmentDate: "",
    appointmentTime: "",
    issueDescription: "",
  });

  // =========================================================
  // PROFILE EDIT FORM STATE
  // Purpose:
  // Stores values for the Edit Profile modal.
  // This edits public.profiles only, not Supabase Auth email/password.
  // =========================================================

  const [profileEditForm, setProfileEditForm] = useState({
    fullName: "",
    phone: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    city: "",
    preferredContactMethod: "",
  });

  const isAdminRoute = hashRoute === "#admin";
  const isAdmin = currentUserProfile?.role === "admin";

  // =========================================================
  // AUTH SESSION LISTENER
  // Purpose:
  // Keeps the app aware of logged-in/logged-out state.
  // =========================================================

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // HASH ROUTE LISTENER
  // Purpose:
  // Lets the admin dashboard open as a separate #admin route.
  // =========================================================

  useEffect(() => {
    const onHashChange = () => setHashRoute(window.location.hash);

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  // =========================================================
  // CURRENT PROFILE LOADER
  // Purpose:
  // Loads logged-in user's profile and role from Supabase.
  // =========================================================

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) {
        setCurrentUserProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Profile load error:", error);
        setCurrentUserProfile(null);
        return;
      }

      setCurrentUserProfile(data);
    };

    loadProfile();
  }, [session]);

  // =========================================================
  // ADMIN DATA LOADER
  // Purpose:
  // Loads profiles and service requests for admin dashboard.
  // =========================================================

  const loadAdminData = async () => {
    if (!session?.user?.id) return;

    setAdminMessage("");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: requestData, error: requestError } = await supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileError || requestError) {
      console.error("Admin load error:", profileError || requestError);
      setAdminMessage(
        `Could not load admin data: ${
          profileError?.message || requestError?.message
        }`
      );
      return;
    }

    setProfiles(profileData || []);
    setServiceRequests(requestData || []);
  };

  useEffect(() => {
    if (currentUserProfile?.role === "admin") {
      loadAdminData();
    }
  }, [currentUserProfile]);

  // =========================================================
  // PROFILE EDIT MODAL OPENER
  // Purpose:
  // Opens a professional profile editor using the current
  // logged-in user's saved profile details.
  // =========================================================

  const openProfileEditor = () => {
    if (!session || !currentUserProfile) {
      setAuthMessage("Please log in before editing your profile.");
      setActiveModal("login");
      return;
    }

    setAuthMessage("");

    setProfileEditForm({
      fullName: currentUserProfile.full_name || "",
      phone: currentUserProfile.phone || "",
      vehicleMake: currentUserProfile.vehicle_make || "",
      vehicleModel: currentUserProfile.vehicle_model || "",
      vehicleYear: currentUserProfile.vehicle_year || "",
      city: currentUserProfile.city || "",
      preferredContactMethod:
        currentUserProfile.preferred_contact_method || "",
    });

    setActiveModal("editProfile");
  };

  // =========================================================
  // PROFILE UPDATE HANDLER
  // Purpose:
  // Allows a logged-in customer/admin to update their own
  // public.profiles row from the website.
  // Email/password are not changed here because Supabase Auth
  // manages those separately.
  // =========================================================

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    if (!session?.user?.id) {
      setAuthMessage("Please log in before updating your profile.");
      return;
    }

    const updatePayload = {
      full_name: profileEditForm.fullName,
      phone: profileEditForm.phone,
      vehicle_make: profileEditForm.vehicleMake,
      vehicle_model: profileEditForm.vehicleModel,
      vehicle_year: profileEditForm.vehicleYear,
      city: profileEditForm.city,
      preferred_contact_method: profileEditForm.preferredContactMethod,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      setAuthMessage(`Could not update profile: ${error.message}`);
      return;
    }

    setCurrentUserProfile(data);
    setAuthMessage("");
    setActiveModal(null);

    if (isAdmin) {
      await loadAdminData();
    }
  };

  // =========================================================
  // SIGNUP HANDLER
  // Purpose:
  // Creates Supabase Auth account.
  // Profile details are sent as Auth metadata so the Supabase
  // trigger can create the profile row automatically.
  // =========================================================

  const handleSignUp = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email: signUpForm.email,
      password: signUpForm.password,
      options: {
        data: {
          full_name: signUpForm.fullName,
          phone: signUpForm.phone,
          vehicle_make: signUpForm.vehicleMake,
          vehicle_model: signUpForm.vehicleModel,
          vehicle_year: signUpForm.vehicleYear,
          city: signUpForm.city,
          preferred_contact_method: signUpForm.preferredContactMethod,
        },
      },
    });

    if (error) {
      setAuthMessage(`Could not create account: ${error.message}`);
      return;
    }

    setAuthMessage(
      "Account created successfully. Please check your email if confirmation is required, then log in."
    );

    setSignUpForm({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      city: "",
      preferredContactMethod: "",
    });
  };

  // =========================================================
  // LOGIN HANDLER
  // Purpose:
  // Logs in customer/admin through Supabase Auth.
  // =========================================================

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      setAuthMessage(`Login failed: ${error.message}`);
      return;
    }

    setAuthMessage("");
    setLoginForm({ email: "", password: "" });
    setActiveModal(null);
  };

  // =========================================================
  // LOGOUT HANDLER
  // Purpose:
  // Ends session and returns user to public website mode.
  // =========================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUserProfile(null);
    window.location.hash = "";
  };

  // =========================================================
  // BOOKING MODAL OPENER
  // Purpose:
  // Opens service request form and pre-fills profile details.
  // =========================================================

  const openBookingModal = (serviceTitle = "") => {
    if (!session) {
      setAuthMessage("Please create an account or log in before booking.");
      setActiveModal("signup");
      return;
    }

    setSelectedService(serviceTitle);
    setBookingMessage("");

    setBookingForm({
      serviceUrgency: "Flexible appointment",
      fullName: currentUserProfile?.full_name || "",
      phone: currentUserProfile?.phone || "",
      email: currentUserProfile?.email || session?.user?.email || "",
      carMake: currentUserProfile?.vehicle_make || "",
      carModel: currentUserProfile?.vehicle_model || "",
      carYear: currentUserProfile?.vehicle_year || "",
      vehicleLocation: currentUserProfile?.city || "",
      appointmentDate: "",
      appointmentTime: "",
      issueDescription: "",
    });

    setActiveModal("booking");
  };

  // =========================================================
  // BOOKING SUBMISSION
  // Purpose:
  // Saves customer request to Supabase and optionally sends
  // Formspree backup notification if VITE_FORMSPREE_URL exists.
  // =========================================================

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    setBookingMessage("");

    if (!session?.user?.id) {
      setBookingMessage("Please create an account or log in before booking.");
      setActiveModal("signup");
      return;
    }

    const payload = {
      user_id: session.user.id,
      selected_service: selectedService || "General Service Request",
      service_urgency: bookingForm.serviceUrgency,
      full_name: bookingForm.fullName,
      phone: bookingForm.phone,
      email: bookingForm.email,
      car_make: bookingForm.carMake,
      car_model: bookingForm.carModel,
      car_year: bookingForm.carYear,
      vehicle_location: bookingForm.vehicleLocation,
      appointment_date: bookingForm.appointmentDate || null,
      appointment_time: bookingForm.appointmentTime || null,
      issue_description: bookingForm.issueDescription,
      status: "pending",
      request_status: "New",
      payment_status: "Unpaid",
      payment_note: "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("service_requests").insert(payload);

    if (error) {
      console.error("Booking error:", error);
      setBookingMessage(`Could not send request: ${error.message}`);
      return;
    }

    if (FORMSPREE_URL) {
      try {
        await fetch(FORMSPREE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (formspreeError) {
        console.warn("Formspree backup failed:", formspreeError);
      }
    }

    setBookingMessage(
      `Request Sent Successfully. Thank you. A team member will contact you shortly. For urgent lockout service, please call ${BUSINESS_PHONE_DISPLAY}.`
    );

    if (isAdmin) {
      loadAdminData();
    }
  };

  // =========================================================
  // ADMIN DASHBOARD FILTERS
  // Purpose:
  // Makes admin cards and filter tabs interactive.
  // =========================================================

  const filteredRequests = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(now.getDate() - 7);

    if (adminFilter === "urgent") {
      return serviceRequests.filter((request) => {
        const urgency = String(request.service_urgency || "").toLowerCase();

        return (
          urgency.includes("today") ||
          urgency.includes("urgent") ||
          urgency.includes("emergency")
        );
      });
    }

    if (adminFilter === "recent") {
      return serviceRequests.filter((request) => {
        if (!request.created_at) return false;

        const created = new Date(request.created_at);

        return created >= sevenDaysAgo;
      });
    }

    return serviceRequests;
  }, [adminFilter, serviceRequests]);

  const urgentRequestsCount = useMemo(() => {
    return serviceRequests.filter((request) => {
      const urgency = String(request.service_urgency || "").toLowerCase();

      return (
        urgency.includes("today") ||
        urgency.includes("urgent") ||
        urgency.includes("emergency")
      );
    }).length;
  }, [serviceRequests]);

  const recentRequestsCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(now.getDate() - 7);

    return serviceRequests.filter((request) => {
      if (!request.created_at) return false;

      const created = new Date(request.created_at);

      return created >= sevenDaysAgo;
    }).length;
  }, [serviceRequests]);

  // =========================================================
  // ADMIN EDIT HANDLERS
  // Purpose:
  // Allows admin to correct customer booking mistakes.
  // =========================================================

  const startEditingRequest = (request) => {
    setEditingRequestId(request.id);

    setEditForm({
      selected_service: request.selected_service || "",
      service_urgency: request.service_urgency || "Flexible appointment",
      car_year: request.car_year || "",
      car_make: request.car_make || "",
      car_model: request.car_model || "",
      vehicle_location: request.vehicle_location || "",
      appointment_date: request.appointment_date || "",
      appointment_time: request.appointment_time || "",
      request_status: request.request_status || "New",
      payment_status: request.payment_status || "Unpaid",
      payment_note: request.payment_note || "",
      issue_description: request.issue_description || "",
    });
  };

  const cancelEditingRequest = () => {
    setEditingRequestId(null);
    setEditForm({});
  };

  const saveRequestUpdate = async (requestId) => {
    setAdminMessage("");

    const updatePayload = {
      selected_service: editForm.selected_service || "",
      service_urgency: editForm.service_urgency || "Flexible appointment",
      car_year: editForm.car_year || "",
      car_make: editForm.car_make || "",
      car_model: editForm.car_model || "",
      vehicle_location: editForm.vehicle_location || "",
      appointment_date: editForm.appointment_date || null,
      appointment_time: editForm.appointment_time || null,
      request_status: editForm.request_status || "New",
      payment_status: editForm.payment_status || "Unpaid",
      payment_note: editForm.payment_note || "",
      issue_description: editForm.issue_description || "",
      status: String(editForm.request_status || "New").toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("service_requests")
      .update(updatePayload)
      .eq("id", requestId);

    if (error) {
      console.error("Admin update error:", error);
      setAdminMessage(`Could not update request: ${error.message}`);
      return;
    }

    setAdminMessage("Request updated successfully.");
    setEditingRequestId(null);
    setEditForm({});
    await loadAdminData();
  };

  // =========================================================
  // ADMIN SELECT / DELETE HANDLERS
  // Purpose:
  // Allows admin to select and delete database rows safely.
  // =========================================================

  const toggleRequestSelection = (requestId) => {
    setSelectedRequestIds((currentIds) =>
      currentIds.includes(requestId)
        ? currentIds.filter((id) => id !== requestId)
        : [...currentIds, requestId]
    );
  };

  const toggleProfileSelection = (profileId) => {
    setSelectedProfileIds((currentIds) =>
      currentIds.includes(profileId)
        ? currentIds.filter((id) => id !== profileId)
        : [...currentIds, profileId]
    );
  };

  const toggleAllVisibleRequests = () => {
    const visibleIds = filteredRequests.map((request) => request.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedRequestIds.includes(id));

    if (allVisibleSelected) {
      setSelectedRequestIds((currentIds) =>
        currentIds.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedRequestIds((currentIds) =>
        Array.from(new Set([...currentIds, ...visibleIds]))
      );
    }
  };

  const toggleAllProfiles = () => {
    const profileIds = profiles.map((profile) => profile.id);
    const allProfilesSelected =
      profileIds.length > 0 &&
      profileIds.every((id) => selectedProfileIds.includes(id));

    if (allProfilesSelected) {
      setSelectedProfileIds([]);
    } else {
      setSelectedProfileIds(profileIds);
    }
  };

  const deleteSelectedRequests = async () => {
    if (selectedRequestIds.length === 0) {
      setAdminMessage("Select at least one service request before deleting.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRequestIds.length} selected service request record(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("service_requests")
      .delete()
      .in("id", selectedRequestIds);

    if (error) {
      console.error("Delete service request error:", error);
      setAdminMessage(`Could not delete service request(s): ${error.message}`);
      return;
    }

    setSelectedRequestIds([]);
    setAdminMessage("Selected service request record(s) deleted successfully.");
    await loadAdminData();
  };

  const deleteSelectedProfiles = async () => {
    if (selectedProfileIds.length === 0) {
      setAdminMessage("Select at least one customer profile before deleting.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProfileIds.length} selected profile row(s)? This removes the customer profile data, but it does not delete the Supabase Auth login account.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .in("id", selectedProfileIds);

    if (error) {
      console.error("Delete profile error:", error);
      setAdminMessage(`Could not delete profile row(s): ${error.message}`);
      return;
    }

    setSelectedProfileIds([]);
    setAdminMessage("Selected customer profile row(s) deleted successfully.");
    await loadAdminData();
  };

  // =========================================================
  // ADMIN DASHBOARD COMPONENT
  // Purpose:
  // Separate professional dashboard page for admin users.
  // =========================================================

  const AdminDashboard = () => {
    if (!session) {
      return (
        <main className="admin-page">
          <section className="admin-container">
            <div className="admin-panel access-panel">
              <p className="section-label">Admin Access</p>
              <h2>Login Required</h2>
              <p>Please log in before opening the admin dashboard.</p>
              <button
                className="admin-save-button"
                type="button"
                onClick={() => setActiveModal("login")}
              >
                Login
              </button>
            </div>
          </section>
        </main>
      );
    }

    if (!isAdmin) {
      return (
        <main className="admin-page">
          <section className="admin-container">
            <div className="admin-panel access-panel">
              <p className="section-label">Restricted</p>
              <h2>Admin Only</h2>
              <p>This page is only available to Gabniks Motors admin users.</p>
              <a href="#" className="admin-save-button">
                Return to Website
              </a>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <h1>Gabniks Motors Admin</h1>
            <p className="developer-credit">
              System maintained by Senior Developer Ami Adebayo.
            </p>
          </div>

          <div className="admin-header-actions">
            <a href="#">Website</a>
            <button type="button" onClick={loadAdminData}>
              Refresh
            </button>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="admin-container">
          <div className="admin-hero-grid">
            <div className="admin-hero-card">
              <p className="section-label">Business Control Center</p>
              <h2>Admin Dashboard</h2>
              <p>
                Manage customer profiles, service requests, schedule urgency,
                request progress, payment tracking, and booking activity from
                one professional dashboard.
              </p>
            </div>

            <div className="admin-profile-card">
              <p className="section-label">Signed in as</p>
              <h3>{currentUserProfile?.full_name || session.user.email}</h3>
              <p>{session.user.email}</p>
              <span className="developer-badge">Admin Access</span>
            </div>
          </div>

          <div className="admin-stats-grid">
            <button
              type="button"
              className={`admin-stat-card ${
                adminFilter === "customers" ? "active" : ""
              }`}
              onClick={() => setAdminFilter("customers")}
            >
              <span>Total Customers</span>
              <strong>{profiles.length}</strong>
              <small>Registered profiles</small>
            </button>

            <button
              type="button"
              className={`admin-stat-card ${
                adminFilter === "all" ? "active" : ""
              }`}
              onClick={() => setAdminFilter("all")}
            >
              <span>Total Requests</span>
              <strong>{serviceRequests.length}</strong>
              <small>All service requests</small>
            </button>

            <button
              type="button"
              className={`admin-stat-card ${
                adminFilter === "urgent" ? "active" : ""
              }`}
              onClick={() => setAdminFilter("urgent")}
            >
              <span>Urgent Requests</span>
              <strong>{urgentRequestsCount}</strong>
              <small>Today / urgent / emergency</small>
            </button>

            <button
              type="button"
              className={`admin-stat-card ${
                adminFilter === "recent" ? "active" : ""
              }`}
              onClick={() => setAdminFilter("recent")}
            >
              <span>Recent Requests</span>
              <strong>{recentRequestsCount}</strong>
              <small>Submitted in last 7 days</small>
            </button>
          </div>

          <div className="admin-filter-tabs">
            <button
              type="button"
              className={adminFilter === "all" ? "active" : ""}
              onClick={() => setAdminFilter("all")}
            >
              All Requests
            </button>

            <button
              type="button"
              className={adminFilter === "urgent" ? "active" : ""}
              onClick={() => setAdminFilter("urgent")}
            >
              Urgent
            </button>

            <button
              type="button"
              className={adminFilter === "recent" ? "active" : ""}
              onClick={() => setAdminFilter("recent")}
            >
              Recent
            </button>

            <button
              type="button"
              className={adminFilter === "customers" ? "active" : ""}
              onClick={() => setAdminFilter("customers")}
            >
              Customers
            </button>
          </div>

          {adminMessage && (
            <div
              className={`admin-message ${
                adminMessage.includes("successfully") ? "success" : "warning"
              }`}
            >
              {adminMessage}
            </div>
          )}

          {adminFilter !== "customers" && (
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <p className="section-label">Operations</p>
                  <h2>Service Requests</h2>
                </div>

                <span className="admin-count-badge">
                  {filteredRequests.length} record(s)
                </span>
              </div>

              <div className="admin-toolbar">
                <button type="button" onClick={toggleAllVisibleRequests}>
                  Select Visible
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={deleteSelectedRequests}
                  disabled={selectedRequestIds.length === 0}
                >
                  Delete Selected ({selectedRequestIds.length})
                </button>
              </div>

              <div className="schedule-legend">
                <span>
                  <i className="legend-dot red"></i> Today / overdue
                </span>
                <span>
                  <i className="legend-dot amber"></i> 1–3 days away
                </span>
                <span>
                  <i className="legend-dot green"></i> 4+ days away
                </span>
                <span>
                  <i className="legend-dot gray"></i> No date
                </span>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Urgency</th>
                      <th>Schedule</th>
                      <th>Vehicle</th>
                      <th>Location</th>
                      <th>Request Status</th>
                      <th>Payment</th>
                      <th>Issue / Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="12">No service requests found.</td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => {
                        const schedule = getScheduleUrgency(
                          request.appointment_date
                        );

                        const isEditing = editingRequestId === request.id;

                        return (
                          <tr key={request.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRequestIds.includes(
                                  request.id
                                )}
                                onChange={() =>
                                  toggleRequestSelection(request.id)
                                }
                                aria-label="Select service request"
                              />
                            </td>

                            <td>{formatDateTime(request.created_at)}</td>

                            <td>
                              <span className="admin-customer-name">
                                {request.full_name || "No name"}
                              </span>
                              <span className="admin-customer-meta">
                                {request.phone || "No phone"}
                              </span>
                              <span className="admin-customer-meta">
                                {request.email || "No email"}
                              </span>
                            </td>

                            <td>
                              {isEditing ? (
                                <select
                                  value={editForm.selected_service || ""}
                                  onChange={(event) =>
                                    setEditForm({
                                      ...editForm,
                                      selected_service: event.target.value,
                                    })
                                  }
                                >
                                  {SERVICES.map((service) => (
                                    <option
                                      key={service.title}
                                      value={service.title}
                                    >
                                      {service.title}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                request.selected_service || "No service"
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <select
                                  value={editForm.service_urgency || ""}
                                  onChange={(event) =>
                                    setEditForm({
                                      ...editForm,
                                      service_urgency: event.target.value,
                                    })
                                  }
                                >
                                  {URGENCY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`urgency-badge ${getUrgencyClass(
                                    request.service_urgency
                                  )}`}
                                >
                                  {request.service_urgency || "Flexible"}
                                </span>
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <div className="admin-edit-grid">
                                  <input
                                    type="date"
                                    value={editForm.appointment_date || ""}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        appointment_date: event.target.value,
                                      })
                                    }
                                  />
                                  <input
                                    type="time"
                                    value={editForm.appointment_time || ""}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        appointment_time: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="schedule-cell">
                                  <span>
                                    {formatAppointment(
                                      request.appointment_date,
                                      request.appointment_time
                                    )}
                                  </span>
                                  <span
                                    className={`schedule-badge ${schedule.className}`}
                                  >
                                    {schedule.label}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <div className="admin-edit-grid">
                                  <input
                                    placeholder="Year"
                                    value={editForm.car_year || ""}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        car_year: event.target.value,
                                      })
                                    }
                                  />
                                  <input
                                    placeholder="Make"
                                    value={editForm.car_make || ""}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        car_make: event.target.value,
                                      })
                                    }
                                  />
                                  <input
                                    placeholder="Model"
                                    value={editForm.car_model || ""}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        car_model: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              ) : (
                                `${request.car_year || ""} ${
                                  request.car_make || ""
                                } ${request.car_model || ""}`
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <input
                                  value={editForm.vehicle_location || ""}
                                  onChange={(event) =>
                                    setEditForm({
                                      ...editForm,
                                      vehicle_location: event.target.value,
                                    })
                                  }
                                />
                              ) : (
                                request.vehicle_location || "No location"
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <select
                                  value={editForm.request_status || "New"}
                                  onChange={(event) =>
                                    setEditForm({
                                      ...editForm,
                                      request_status: event.target.value,
                                    })
                                  }
                                >
                                  {REQUEST_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`status-badge ${getRequestStatusClass(
                                    request.request_status
                                  )}`}
                                >
                                  {request.request_status || "New"}
                                </span>
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <div className="admin-edit-grid">
                                  <select
                                    value={editForm.payment_status || "Unpaid"}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        payment_status: event.target.value,
                                      })
                                    }
                                  >
                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    placeholder="Payment note"
                                    value={editForm.payment_note || ""}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        payment_note: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="payment-cell">
                                  <span
                                    className={`payment-badge ${getPaymentStatusClass(
                                      request.payment_status
                                    )}`}
                                  >
                                    {request.payment_status || "Unpaid"}
                                  </span>

                                  {request.payment_note && (
                                    <small>{request.payment_note}</small>
                                  )}
                                </div>
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <textarea
                                  value={editForm.issue_description || ""}
                                  onChange={(event) =>
                                    setEditForm({
                                      ...editForm,
                                      issue_description: event.target.value,
                                    })
                                  }
                                />
                              ) : (
                                request.issue_description || "No issue provided"
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <div className="admin-action-buttons">
                                  <button
                                    type="button"
                                    className="admin-save-button"
                                    onClick={() => saveRequestUpdate(request.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-cancel-button"
                                    onClick={cancelEditingRequest}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-edit-button"
                                  onClick={() => startEditingRequest(request)}
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {adminFilter === "customers" && (
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <p className="section-label">Customers</p>
                  <h2>Customer Profiles</h2>
                </div>

                <span className="admin-count-badge">
                  {profiles.length} record(s)
                </span>
              </div>

              <div className="admin-toolbar">
                <button type="button" onClick={toggleAllProfiles}>
                  Select All
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={deleteSelectedProfiles}
                  disabled={selectedProfileIds.length === 0}
                >
                  Delete Selected ({selectedProfileIds.length})
                </button>
              </div>

              <p className="admin-note">
                Deleting a profile removes the customer profile row from this
                dashboard. It does not delete the customer login from Supabase
                Authentication.
              </p>

              <div className="admin-table-wrapper">
                <table className="admin-table customer-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Joined</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Vehicle</th>
                      <th>City</th>
                      <th>Contact Method</th>
                      <th>Role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {profiles.length === 0 ? (
                      <tr>
                        <td colSpan="9">No customer profiles found.</td>
                      </tr>
                    ) : (
                      profiles.map((profile) => (
                        <tr key={profile.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedProfileIds.includes(profile.id)}
                              onChange={() =>
                                toggleProfileSelection(profile.id)
                              }
                              aria-label="Select customer profile"
                            />
                          </td>
                          <td>{formatDateTime(profile.created_at)}</td>
                          <td>{profile.full_name || "No name"}</td>
                          <td>{profile.email || "No email"}</td>
                          <td>{profile.phone || "No phone"}</td>
                          <td>
                            {profile.vehicle_year || ""}{" "}
                            {profile.vehicle_make || ""}{" "}
                            {profile.vehicle_model || ""}
                          </td>
                          <td>{profile.city || "No city"}</td>
                          <td>
                            {profile.preferred_contact_method || "Not selected"}
                          </td>
                          <td>
                            <span
                              className={`customer-role-badge ${
                                profile.role === "customer" ? "customer" : ""
                              }`}
                            >
                              {profile.role || "customer"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>

        <footer className="admin-footer">
          <p>System maintained by Senior Developer Ami Adebayo.</p>
        </footer>
      </main>
    );
  };

  return (
    <div className="app">
      {isAdminRoute ? (
        <AdminDashboard />
      ) : (
        <>
          <header className="header">
            <div className="header-container">
              <a href="#home" className="logo">
                <img
                  src={logoImage}
                  alt="Gabniks Motors"
                  className="logo-image"
                />
              </a>

              <nav className="nav-links">
                <a href="#home">Home</a>
                <a href="#services">Services</a>
                <a href="#about">About</a>
                <a href="#gallery">Gallery</a>
                <a href="#faq">FAQ</a>
                <a href="#contact">Contact</a>

                {!session && (
                  <>
                    <button
                      type="button"
                      className="nav-button"
                      onClick={() => setActiveModal("signup")}
                    >
                      Sign Up
                    </button>

                    <button
                      type="button"
                      className="nav-button"
                      onClick={() => setActiveModal("login")}
                    >
                      Login
                    </button>
                  </>
                )}

                {session && (
                  <button
                    type="button"
                    className="nav-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                )}

                {isAdmin && (
                  <a href="#admin" className="admin-nav-link">
                    Admin
                  </a>
                )}
              </nav>

              <div className="header-icons">
                <a className="icon-circle phone-icon" href={BUSINESS_PHONE_LINK}>
                  ☎
                </a>

                <a
                  className="icon-circle message-icon"
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬
                </a>

                <a
                  className="icon-circle facebook-icon"
                  href={FACEBOOK_LINK}
                  target="_blank"
                  rel="noreferrer"
                >
                  f
                </a>
              </div>
            </div>
          </header>

          <section id="home" className="hero-section">
            <div className="hero-background">
              <img src={heroImage} alt="Automotive locksmith service" />
              <div className="hero-overlay"></div>
            </div>

            {session && currentUserProfile && (
              <div className="hero-user-strip">
                <div className="hero-user-card">
                  <span>Welcome back</span>

                  <strong>
                    {currentUserProfile.full_name || session.user.email}
                  </strong>

                  <small>
                    {currentUserProfile.role === "admin"
                      ? "Admin Account"
                      : "Customer Account"}
                  </small>

                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={openProfileEditor}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            <div className="hero-content">
              <p className="hero-label">
                Trusted Automotive Locksmith & Diagnostic Specialists
              </p>

              <h1>Fast. Reliable. Professional Automotive Solutions.</h1>

              <p className="hero-text">
                Gabniks Motors & Tech LLC provides mobile automotive locksmith,
                diagnostics, ECU programming, TPMS service, airbag support, and
                emergency lockout assistance.
              </p>

              <div className="hero-buttons hero-buttons-visible">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => openBookingModal("General Service Request")}
                >
                  Book a Service
                </button>

                <a className="secondary-button" href={BUSINESS_PHONE_LINK}>
                  Call Now
                </a>
              </div>
            </div>
          </section>

          <section id="services" className="section services-section">
            <div className="section-container">
              <p className="section-label">Our Services</p>
              <h2 className="section-title">Car Services</h2>
              <p className="section-description">
                Select a service below to send a booking request directly to
                Gabniks Motors.
              </p>

              <div className="services-grid">
                {SERVICES.map((service) => (
                  <button
                    type="button"
                    className="service-card"
                    key={service.title}
                    onClick={() => openBookingModal(service.title)}
                  >
                    <span className="service-icon">{service.icon}</span>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="about" className="about-section">
            <div className="about-container">
              <p className="section-label">About Gabniks Motors</p>
              <h2 className="about-title">Dependable Automotive Support</h2>
              <p className="about-text">
                Gabniks Motors & Tech LLC provides reliable mobile automotive
                support for drivers who need fast, skilled, and professional
                service. From key programming to diagnostics and lockout
                support, the business is built around trust, speed, and
                excellent customer care.
              </p>

              <div className="about-features">
                <div>Mobile Service</div>
                <div>Emergency Help</div>
                <div>Diagnostics</div>
                <div>Professional Support</div>
              </div>
            </div>
          </section>

          <section id="gallery" className="section gallery-section">
            <div className="section-container">
              <p className="section-label">Gallery</p>
              <h2 className="section-title">Work & Service Highlights</h2>
              <p className="section-description">
                Photos and service updates can be added here as the business
                grows.
              </p>
            </div>
          </section>

          <section id="faq" className="faq-section">
            <div className="section-container">
              <p className="section-label">FAQ</p>
              <h2 className="section-title">Questions</h2>

              <div className="faq-grid">
                <div className="faq-card">
                  <h3>Do I need an account to book?</h3>
                  <p>
                    Yes. Creating an account helps Gabniks Motors keep your
                    service history, vehicle details, and booking records in one
                    secure place.
                  </p>
                </div>

                <div className="faq-card">
                  <h3>Can I request emergency help?</h3>
                  <p>
                    Yes. Select urgent or emergency during booking, or call
                    directly for immediate lockout assistance.
                  </p>
                </div>

                <div className="faq-card">
                  <h3>Can the admin update my booking?</h3>
                  <p>
                    Yes. If a customer makes a mistake, the admin can update the
                    service, urgency, schedule, vehicle details, payment status,
                    and notes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="contact" className="service-area-section">
            <div className="section-container">
              <p className="section-label">Contact</p>
              <h2 className="section-title">Need Service?</h2>
              <p className="section-description">
                Book online, send a WhatsApp message, or call directly for
                urgent automotive support.
              </p>

              <div className="service-area-actions">
                <button
                  type="button"
                  className="service-area-button"
                  onClick={() => openBookingModal("General Service Request")}
                >
                  Book Appointment
                </button>

                <a
                  className="service-area-button whatsapp"
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>

              <div className="map-card">
                <iframe
                  title="Gabniks Motors Service Area Map"
                  src={GOOGLE_MAP_EMBED_URL}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </section>

          <footer className="footer">
            <p>
              © {new Date().getFullYear()} Gabniks Motors & Tech LLC. All
              rights reserved.
            </p>
          </footer>

          <a
            className="floating-whatsapp"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            💬
          </a>

          <button
            type="button"
            className="back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            ↑
          </button>
        </>
      )}

      {activeModal === "signup" && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <button
              type="button"
              className="modal-close-button"
              onClick={() => setActiveModal(null)}
            >
              ×
            </button>

            <p className="section-label">Customer Account</p>
            <h2>Create Account</h2>

            {authMessage && <div className="form-message">{authMessage}</div>}

            <form onSubmit={handleSignUp} className="auth-form">
              <div className="form-grid">
                <label>
                  Full Name
                  <input
                    required
                    placeholder="Enter full name"
                    value={signUpForm.fullName}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        fullName: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    required
                    placeholder="Enter phone number"
                    value={signUpForm.phone}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        phone: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Email Address
                  <input
                    required
                    type="email"
                    placeholder="Enter email address"
                    value={signUpForm.email}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        email: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Password
                  <input
                    required
                    type="password"
                    placeholder="Create password"
                    value={signUpForm.password}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        password: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Vehicle Make
                  <input
                    placeholder="Example: Toyota"
                    value={signUpForm.vehicleMake}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        vehicleMake: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Vehicle Model
                  <input
                    placeholder="Example: Camry"
                    value={signUpForm.vehicleModel}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        vehicleModel: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Vehicle Year
                  <input
                    placeholder="Example: 2018"
                    value={signUpForm.vehicleYear}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        vehicleYear: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  City / Service Area
                  <input
                    placeholder="Example: Atlanta"
                    value={signUpForm.city}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        city: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Preferred Contact Method
                <select
                  required
                  value={signUpForm.preferredContactMethod}
                  onChange={(event) =>
                    setSignUpForm({
                      ...signUpForm,
                      preferredContactMethod: event.target.value,
                    })
                  }
                >
                  <option value="">Select contact method</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </label>

              <button type="submit" className="full-submit-button">
                Create Account
              </button>

              <button
                type="button"
                className="modal-switch-button"
                onClick={() => {
                  setAuthMessage("");
                  setActiveModal("login");
                }}
              >
                Already have an account? Login
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === "login" && (
        <div className="modal-overlay">
          <div className="auth-modal small-auth-modal">
            <button
              type="button"
              className="modal-close-button"
              onClick={() => setActiveModal(null)}
            >
              ×
            </button>

            <p className="section-label">Customer Login</p>
            <h2>Login</h2>

            {authMessage && <div className="form-message">{authMessage}</div>}

            <form onSubmit={handleLogin} className="auth-form">
              <label>
                Email Address
                <input
                  required
                  type="email"
                  placeholder="Enter email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      email: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Password
                <input
                  required
                  type="password"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      password: event.target.value,
                    })
                  }
                />
              </label>

              <button type="submit" className="full-submit-button">
                Login
              </button>

              <button
                type="button"
                className="modal-switch-button"
                onClick={() => {
                  setAuthMessage("");
                  setActiveModal("signup");
                }}
              >
                Need an account? Sign up
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === "editProfile" && (
        <div className="modal-overlay">
          <div className="auth-modal profile-edit-modal">
            <button
              type="button"
              className="modal-close-button"
              onClick={() => {
                setAuthMessage("");
                setActiveModal(null);
              }}
            >
              ×
            </button>

            <p className="section-label">Account Profile</p>
            <h2>Edit Profile</h2>

            <p className="profile-edit-description">
              Update your contact and vehicle details. These details help
              Gabniks Motors prepare faster when you book a service.
            </p>

            {authMessage && <div className="form-message">{authMessage}</div>}

            <form onSubmit={handleProfileUpdate} className="auth-form">
              <div className="form-grid">
                <label>
                  Full Name
                  <input
                    required
                    placeholder="Enter full name"
                    value={profileEditForm.fullName}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        fullName: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    required
                    placeholder="Enter phone number"
                    value={profileEditForm.phone}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        phone: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Vehicle Make
                  <input
                    placeholder="Example: Toyota"
                    value={profileEditForm.vehicleMake}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        vehicleMake: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Vehicle Model
                  <input
                    placeholder="Example: Camry"
                    value={profileEditForm.vehicleModel}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        vehicleModel: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Vehicle Year
                  <input
                    placeholder="Example: 2018"
                    value={profileEditForm.vehicleYear}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        vehicleYear: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  City / Service Area
                  <input
                    placeholder="Example: Atlanta"
                    value={profileEditForm.city}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        city: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Preferred Contact Method
                <select
                  required
                  value={profileEditForm.preferredContactMethod}
                  onChange={(event) =>
                    setProfileEditForm({
                      ...profileEditForm,
                      preferredContactMethod: event.target.value,
                    })
                  }
                >
                  <option value="">Select contact method</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </label>

              <div className="profile-email-note">
                <strong>Email:</strong> {session?.user?.email}
                <br />
                Email and password changes should be handled separately for
                security.
              </div>

              <button type="submit" className="full-submit-button">
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === "booking" && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <button
              type="button"
              className="modal-close-button"
              onClick={() => setActiveModal(null)}
            >
              ×
            </button>

            <p className="section-label">Book Appointment</p>
            <h2>Request Service</h2>

            <p className="selected-service-text">
              Selected Service:{" "}
              <strong>{selectedService || "General Service Request"}</strong>
            </p>

            {bookingMessage ? (
              <div className="booking-success-card">
                <h3>Request Sent Successfully</h3>
                <p>{bookingMessage}</p>
                <button
                  type="button"
                  className="full-submit-button"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="booking-form">
                <label>
                  Service Urgency
                  <select
                    value={bookingForm.serviceUrgency}
                    onChange={(event) =>
                      setBookingForm({
                        ...bookingForm,
                        serviceUrgency: event.target.value,
                      })
                    }
                  >
                    {URGENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-grid">
                  <label>
                    Full Name
                    <input
                      required
                      value={bookingForm.fullName}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          fullName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      required
                      value={bookingForm.phone}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          phone: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      required
                      type="email"
                      value={bookingForm.email}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          email: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Vehicle Location
                    <input
                      required
                      value={bookingForm.vehicleLocation}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          vehicleLocation: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Car Make
                    <input
                      value={bookingForm.carMake}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          carMake: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Car Model
                    <input
                      value={bookingForm.carModel}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          carModel: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Car Year
                    <input
                      value={bookingForm.carYear}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          carYear: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Appointment Date
                    <input
                      type="date"
                      value={bookingForm.appointmentDate}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          appointmentDate: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Appointment Time
                    <input
                      type="time"
                      value={bookingForm.appointmentTime}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          appointmentTime: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label>
                  Issue Description
                  <textarea
                    required
                    value={bookingForm.issueDescription}
                    onChange={(event) =>
                      setBookingForm({
                        ...bookingForm,
                        issueDescription: event.target.value,
                      })
                    }
                  ></textarea>
                </label>

                <button type="submit" className="full-submit-button">
                  Send Service Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
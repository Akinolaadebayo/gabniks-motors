// =========================================================
// FILE: src/App.jsx
// PROJECT: Gabniks Motors & Tech LLC
//
// FUNCTION:
// Controls the full React website:
// - Public homepage
// - Signup/login
// - Email verification mailbox button after signup
// - Password reset
// - Customer profile editing
// - Service booking
// - Developer/admin dashboard
// - Admin search with Search button only
// - Header account controls
// - Temporary Welcome Back card
//
// LATEST UPDATE:
// - Booking form now prevents duplicate submissions.
// - After successful booking, customer sees Close or Book Another Service.
// - Booking submit button disables while saving.
// =========================================================

import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./libs/supabaseClient";
import logoImage from "./assets/Gabnik_logo.png";

// =========================================================
// BUSINESS CONSTANTS
// Affects: call buttons, WhatsApp buttons, email redirect, map.
// =========================================================

const BUSINESS_PHONE_DISPLAY = "+1 (678) 749-0856";
const BUSINESS_PHONE_LINK = "tel:+16787490856";
const WHATSAPP_LINK = "https://wa.me/16787490856";
const FACEBOOK_LINK = "#";
const FORMSPREE_URL = import.meta.env.VITE_FORMSPREE_URL || "";
const LIVE_SITE_URL = "https://gabniksmotors.com";

const GOOGLE_MAP_EMBED_URL =
  "https://www.google.com/maps?q=Atlanta,%20GA,%20USA&output=embed";

// =========================================================
// SERVICE LIST
// Affects: service cards, booking modal, admin edit dropdown.
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
// Affects: admin request editing fields.
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
// FORMAT HELPERS
// Affects: admin tables and readable date/address/vehicle output.
// =========================================================

const formatDateTime = (dateValue) => {
  if (!dateValue) return "No date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Invalid date";

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

  if (Number.isNaN(date.getTime())) return "Invalid appointment";

  const dateText = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return timeValue ? `${dateText} at ${timeValue}` : dateText;
};

const buildContactAddress = (street, city, stateProvince) => {
  return [street, city, stateProvince].filter(Boolean).join(", ");
};

const formatCustomerAddress = (profile) => {
  const separatedAddress = buildContactAddress(
    profile.contact_street,
    profile.contact_city,
    profile.contact_state_province
  );

  return separatedAddress || profile.contact_address || "Not provided";
};

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

const normalizeSearchValue = (value) => {
  return String(value || "").toLowerCase().trim();
};

// =========================================================
// EMAIL INBOX HELPERS
// Affects: signup success message.
// =========================================================

const getEmailInboxUrl = (email) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const domain = normalizedEmail.split("@")[1] || "";

  if (normalizedEmail.endsWith("@gmail.com")) {
    return "https://mail.google.com/mail/u/0/#inbox";
  }

  if (
    normalizedEmail.endsWith("@outlook.com") ||
    normalizedEmail.endsWith("@hotmail.com") ||
    normalizedEmail.endsWith("@live.com") ||
    normalizedEmail.endsWith("@msn.com")
  ) {
    return "https://outlook.live.com/mail/0/inbox";
  }

  if (normalizedEmail.endsWith("@yahoo.com")) {
    return "https://mail.yahoo.com/";
  }

  if (
    normalizedEmail.endsWith("@icloud.com") ||
    normalizedEmail.endsWith("@me.com") ||
    normalizedEmail.endsWith("@mac.com")
  ) {
    return "https://www.icloud.com/mail";
  }

  return `https://www.google.com/search?q=${encodeURIComponent(
    `${domain || "email"} email login`
  )}`;
};

const getEmailProviderLabel = (email) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();

  if (normalizedEmail.endsWith("@gmail.com")) return "Open Gmail Inbox";

  if (
    normalizedEmail.endsWith("@outlook.com") ||
    normalizedEmail.endsWith("@hotmail.com") ||
    normalizedEmail.endsWith("@live.com") ||
    normalizedEmail.endsWith("@msn.com")
  ) {
    return "Open Outlook Inbox";
  }

  if (normalizedEmail.endsWith("@yahoo.com")) return "Open Yahoo Mail";

  if (
    normalizedEmail.endsWith("@icloud.com") ||
    normalizedEmail.endsWith("@me.com") ||
    normalizedEmail.endsWith("@mac.com")
  ) {
    return "Open iCloud Mail";
  }

  return "Open Email Provider";
};

// =========================================================
// BADGE HELPERS
// Affects: admin request schedule/status/payment badges.
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

function App() {
  const customerTableRef = useRef(null);
  const requestPanelRef = useRef(null);
  const customerPanelRef = useRef(null);
  const adminSearchInputRef = useRef(null);

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
  const [adminSearchTerm, setAdminSearchTerm] = useState("");

  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHeroWelcome, setShowHeroWelcome] = useState(false);
  const [hashRoute, setHashRoute] = useState(window.location.hash);

  // =========================================================
  // BOOKING PROTECTION STATE
  // Affects: booking modal submit behavior.
  //
  // What it does:
  // - bookingSubmitting blocks double-click duplicate inserts.
  // - bookingCompleted changes the UI after successful booking.
  // =========================================================

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingCompleted, setBookingCompleted] = useState(false);

  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    contactStreet: "",
    contactCity: "",
    contactStateProvince: "",
    preferredContactMethod: "",
  });

  const [signupSuccessEmail, setSignupSuccessEmail] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginFailedOnce, setLoginFailedOnce] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const getEmptyBookingForm = () => ({
    serviceUrgency: "Flexible appointment",
    fullName: currentUserProfile?.full_name || "",
    phone: currentUserProfile?.phone || "",
    email: currentUserProfile?.email || session?.user?.email || "",
    carMake: "",
    carModel: "",
    carYear: "",
    vehicleLocation:
      currentUserProfile?.contact_city ||
      currentUserProfile?.contact_address ||
      "",
    appointmentDate: "",
    appointmentTime: "",
    issueDescription: "",
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

  const [profileEditForm, setProfileEditForm] = useState({
    fullName: "",
    phone: "",
    contactStreet: "",
    contactCity: "",
    contactStateProvince: "",
    preferredContactMethod: "",
  });

  const userRole = String(currentUserProfile?.role || "")
    .toLowerCase()
    .trim();

  const isDeveloper = userRole === "developer";
  const isBusinessAdmin = userRole === "admin";
  const canAccessAdmin = isDeveloper || isBusinessAdmin;
  const isAdminRoute = hashRoute === "#admin";

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

  useEffect(() => {
    const onHashChange = () => setHashRoute(window.location.hash);

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

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

  useEffect(() => {
    if (!session || !currentUserProfile) {
      setShowHeroWelcome(false);
      return;
    }

    setShowHeroWelcome(true);

    const timer = setTimeout(() => {
      setShowHeroWelcome(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, [session, currentUserProfile?.id]);

  const loadAdminData = async () => {
    if (!session?.user?.id) return;

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
    if (canAccessAdmin) {
      loadAdminData();
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (!adminMessage) return;

    const timer = setTimeout(() => {
      setAdminMessage("");
    }, 1800);

    return () => clearTimeout(timer);
  }, [adminMessage]);

  const handleAdminRefresh = async () => {
    try {
      setIsRefreshing(true);
      setAdminMessage("");

      await Promise.all([
        loadAdminData(),
        new Promise((resolve) => setTimeout(resolve, 650)),
      ]);

      setAdminMessage("Dashboard refreshed successfully.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const scrollCustomerTable = (direction) => {
    if (!customerTableRef.current) return;

    const scrollAmountX = 340;
    const scrollAmountY = 260;

    if (direction === "left") {
      customerTableRef.current.scrollBy({
        left: -scrollAmountX,
        behavior: "smooth",
      });
    }

    if (direction === "right") {
      customerTableRef.current.scrollBy({
        left: scrollAmountX,
        behavior: "smooth",
      });
    }

    if (direction === "up") {
      customerTableRef.current.scrollBy({
        top: -scrollAmountY,
        behavior: "smooth",
      });
    }

    if (direction === "down") {
      customerTableRef.current.scrollBy({
        top: scrollAmountY,
        behavior: "smooth",
      });
    }

    if (direction === "start") {
      customerTableRef.current.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    }

    if (direction === "end") {
      customerTableRef.current.scrollTo({
        left: customerTableRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  };

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
      contactStreet: currentUserProfile.contact_street || "",
      contactCity: currentUserProfile.contact_city || "",
      contactStateProvince: currentUserProfile.contact_state_province || "",
      preferredContactMethod:
        currentUserProfile.preferred_contact_method || "",
    });

    setActiveModal("editProfile");
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    if (!session?.user?.id) {
      setAuthMessage("Please log in before updating your profile.");
      return;
    }

    const contactAddress = buildContactAddress(
      profileEditForm.contactStreet,
      profileEditForm.contactCity,
      profileEditForm.contactStateProvince
    );

    const updatePayload = {
      full_name: profileEditForm.fullName,
      phone: profileEditForm.phone,
      contact_street: profileEditForm.contactStreet,
      contact_city: profileEditForm.contactCity,
      contact_state_province: profileEditForm.contactStateProvince,
      contact_address: contactAddress,
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

    if (canAccessAdmin) {
      await loadAdminData();
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setAuthMessage("");
    setSignupSuccessEmail("");

    const contactAddress = buildContactAddress(
      signUpForm.contactStreet,
      signUpForm.contactCity,
      signUpForm.contactStateProvince
    );

    const { error } = await supabase.auth.signUp({
      email: signUpForm.email,
      password: signUpForm.password,
      options: {
        emailRedirectTo: LIVE_SITE_URL,
        data: {
          full_name: signUpForm.fullName,
          phone: signUpForm.phone,
          contact_street: signUpForm.contactStreet,
          contact_city: signUpForm.contactCity,
          contact_state_province: signUpForm.contactStateProvince,
          contact_address: contactAddress,
          preferred_contact_method: signUpForm.preferredContactMethod,
        },
      },
    });

    if (error) {
      setSignupSuccessEmail("");
      setAuthMessage(`Could not create account: ${error.message}`);
      return;
    }

    setSignupSuccessEmail(signUpForm.email.trim());

    setAuthMessage(
      "Account created successfully. Please check your email to confirm your account before logging in."
    );

    setSignUpForm({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      contactStreet: "",
      contactCity: "",
      contactStateProvince: "",
      preferredContactMethod: "",
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email.trim(),
      password: loginForm.password,
    });

    if (error) {
      setLoginFailedOnce(true);
      setAuthMessage(
        "Login failed. Please check your email and password. You can reset your password below."
      );
      return;
    }

    setLoginFailedOnce(false);
    setAuthMessage("");
    setLoginForm({ email: "", password: "" });
    setActiveModal(null);
  };

  const handlePasswordReset = async () => {
    setAuthMessage("");

    const email = loginForm.email.trim().toLowerCase();

    if (!email) {
      setAuthMessage("Please enter your email address first.");
      return;
    }

    try {
      setResetLoading(true);

      const { data: emailExists, error: checkError } = await supabase.rpc(
        "profile_email_exists",
        {
          lookup_email: email,
        }
      );

      if (checkError) {
        console.error("Email check error:", checkError);
        setAuthMessage(
          "Could not verify this email right now. Please try again shortly."
        );
        return;
      }

      if (!emailExists) {
        setAuthMessage("Invalid email address. This email is not registered.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: LIVE_SITE_URL,
        }
      );

      if (resetError) {
        setAuthMessage(`Could not send reset email: ${resetError.message}`);
        return;
      }

      setAuthMessage(
        "Password reset email sent. Please check your inbox and follow the link."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUserProfile(null);
    setShowHeroWelcome(false);
    window.location.hash = "";
  };

  const openBookingModal = (serviceTitle = "") => {
    setSelectedService(serviceTitle);
    setBookingMessage("");
    setBookingCompleted(false);
    setBookingSubmitting(false);

    if (!session) {
      setAuthMessage("Please create an account or log in before booking.");
      setSignupSuccessEmail("");
      setActiveModal("signup");
      return;
    }

    setBookingForm(getEmptyBookingForm());
    setActiveModal("booking");
  };

  const handleBookAnotherService = () => {
    setBookingMessage("");
    setBookingCompleted(false);
    setBookingSubmitting(false);
    setBookingForm(getEmptyBookingForm());
  };

  // =========================================================
  // BOOKING SUBMIT
  // Affects: service_requests table.
  //
  // What it does:
  // - Prevents double-save duplicate submissions.
  // - Disables submit button while request is saving.
  // - After success, keeps the success message and shows exit options.
  // =========================================================

  const handleBookingSubmit = async (event) => {
    event.preventDefault();

    if (bookingSubmitting || bookingCompleted) {
      return;
    }

    setBookingMessage("");

    if (!session?.user?.id) {
      setBookingMessage("Please create an account or log in before booking.");
      setSignupSuccessEmail("");
      setActiveModal("signup");
      return;
    }

    setBookingSubmitting(true);

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
      setBookingSubmitting(false);
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

    setBookingCompleted(true);
    setBookingSubmitting(false);

    setBookingMessage(
      `Request sent successfully. A team member will contact you shortly. For urgent lockout service, please call ${BUSINESS_PHONE_DISPLAY}.`
    );

    if (canAccessAdmin) {
      loadAdminData();
    }
  };

  const searchValue = normalizeSearchValue(adminSearchTerm);

  const matchesCustomerSearch = (profile) => {
    if (!searchValue) return true;

    const searchableText = [
      profile.full_name,
      profile.email,
      profile.phone,
      profile.contact_street,
      profile.contact_city,
      profile.contact_state_province,
      profile.contact_address,
      profile.preferred_contact_method,
      profile.role,
      formatCustomerAddress(profile),
    ]
      .map(normalizeSearchValue)
      .join(" ");

    return searchableText.includes(searchValue);
  };

  const matchesRequestSearch = (request) => {
    if (!searchValue) return true;

    const searchableText = [
      request.full_name,
      request.phone,
      request.email,
      request.selected_service,
      request.service_urgency,
      request.car_year,
      request.car_make,
      request.car_model,
      formatVehicle(request),
      request.vehicle_location,
      request.appointment_date,
      request.appointment_time,
      request.request_status,
      request.payment_status,
      request.payment_note,
      request.issue_description,
      request.status,
    ]
      .map(normalizeSearchValue)
      .join(" ");

    return searchableText.includes(searchValue);
  };

  const filteredRequests = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(now.getDate() - 7);

    let baseRequests = serviceRequests;

    if (adminFilter === "urgent") {
      baseRequests = serviceRequests.filter((request) => {
        const urgency = String(request.service_urgency || "").toLowerCase();

        return (
          urgency.includes("today") ||
          urgency.includes("urgent") ||
          urgency.includes("emergency")
        );
      });
    }

    if (adminFilter === "recent") {
      baseRequests = serviceRequests.filter((request) => {
        if (!request.created_at) return false;

        const created = new Date(request.created_at);

        return created >= sevenDaysAgo;
      });
    }

    return baseRequests.filter(matchesRequestSearch);
  }, [adminFilter, serviceRequests, adminSearchTerm]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(matchesCustomerSearch);
  }, [profiles, adminSearchTerm]);

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

  const handleAdminSearchSubmit = (event) => {
    event.preventDefault();

    const cleanedSearch = adminSearchInputRef.current?.value?.trim() || "";

    setAdminSearchTerm(cleanedSearch);

    setTimeout(() => {
      if (adminFilter === "customers") {
        customerPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        requestPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);
  };

  const handleAdminSearchClear = () => {
    if (adminSearchInputRef.current) {
      adminSearchInputRef.current.value = "";
    }

    setAdminSearchTerm("");

    setTimeout(() => {
      if (adminFilter === "customers") {
        customerPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        requestPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);
  };

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
    const profileIds = filteredProfiles.map((profile) => profile.id);
    const allProfilesSelected =
      profileIds.length > 0 &&
      profileIds.every((id) => selectedProfileIds.includes(id));

    if (allProfilesSelected) {
      setSelectedProfileIds((currentIds) =>
        currentIds.filter((id) => !profileIds.includes(id))
      );
    } else {
      setSelectedProfileIds((currentIds) =>
        Array.from(new Set([...currentIds, ...profileIds]))
      );
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

    if (!canAccessAdmin) {
      return (
        <main className="admin-page">
          <section className="admin-container">
            <div className="admin-panel access-panel">
              <p className="section-label">Restricted</p>
              <h2>Developer / Admin Only</h2>
              <p>
                This page is only available to Gabniks Motors developers and
                admin users.
              </p>
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

            <button
              type="button"
              className={`admin-refresh-button ${
                isRefreshing ? "refreshing" : ""
              }`}
              onClick={handleAdminRefresh}
              disabled={isRefreshing}
            >
              <span className="refresh-icon">↻</span>
              {isRefreshing ? "Refreshing..." : "Refresh"}
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
              <span className="developer-badge">
                {isDeveloper ? "Developer Access" : "Admin Access"}
              </span>
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

          <form
            className="admin-search-panel"
            onSubmit={handleAdminSearchSubmit}
          >
            <div className="admin-search-copy">
              <span>Search Records</span>
              <small>
                {adminSearchTerm
                  ? `${
                      adminFilter === "customers"
                        ? filteredProfiles.length
                        : filteredRequests.length
                    } matching record(s)`
                  : "Type first, then click Search"}
              </small>
            </div>

            <div className="admin-search-control">
              <span className="admin-search-icon">⌕</span>

              <input
                ref={adminSearchInputRef}
                type="search"
                placeholder={
                  adminFilter === "customers"
                    ? "Search customers by name, phone, email, city, address, or role..."
                    : "Search requests by customer, phone, email, service, vehicle, location, status, or notes..."
                }
                aria-label="Search admin records"
                autoComplete="off"
              />

              <button type="submit" className="admin-search-submit">
                Search
              </button>

              {adminSearchTerm && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={handleAdminSearchClear}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

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
            <section className="admin-panel" ref={requestPanelRef}>
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
                                formatVehicle(request)
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
                                  value={editForm.request_status || ""}
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
                                  className={`request-status-badge ${getRequestStatusClass(
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
                                    value={editForm.payment_status || ""}
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

                                  <textarea
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
                                <div>
                                  <span
                                    className={`payment-status-badge ${getPaymentStatusClass(
                                      request.payment_status
                                    )}`}
                                  >
                                    {request.payment_status || "Unpaid"}
                                  </span>

                                  {request.payment_note && (
                                    <span className="admin-customer-meta">
                                      {request.payment_note}
                                    </span>
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
                                request.issue_description || "No notes"
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <div className="admin-action-stack">
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
            <section className="admin-panel" ref={customerPanelRef}>
              <div className="admin-panel-header">
                <div>
                  <p className="section-label">Customers</p>
                  <h2>Customer Profiles</h2>
                </div>

                <span className="admin-count-badge">
                  {filteredProfiles.length} record(s)
                </span>
              </div>

              <div className="admin-toolbar">
                <button type="button" onClick={toggleAllProfiles}>
                  Select Visible
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

              <div className="table-navigation-controls">
                <button
                  type="button"
                  onClick={() => scrollCustomerTable("start")}
                >
                  ⏮ Start
                </button>

                <button
                  type="button"
                  onClick={() => scrollCustomerTable("left")}
                >
                  ← Left
                </button>

                <button
                  type="button"
                  onClick={() => scrollCustomerTable("right")}
                >
                  Right →
                </button>

                <button
                  type="button"
                  onClick={() => scrollCustomerTable("end")}
                >
                  End ⏭
                </button>

                <button type="button" onClick={() => scrollCustomerTable("up")}>
                  ↑ Up
                </button>

                <button
                  type="button"
                  onClick={() => scrollCustomerTable("down")}
                >
                  Down ↓
                </button>
              </div>

              <div
                className="admin-table-wrapper customer-scroll-wrapper"
                ref={customerTableRef}
                tabIndex="-1"
              >
                <table className="admin-table customer-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Joined</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Street</th>
                      <th>City</th>
                      <th>State / Province</th>
                      <th>Full Address</th>
                      <th>Contact Method</th>
                      <th>Role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td colSpan="11">No customer profiles found.</td>
                      </tr>
                    ) : (
                      filteredProfiles.map((profile) => (
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
                          <td>{profile.contact_street || "Not provided"}</td>
                          <td>{profile.contact_city || "Not provided"}</td>
                          <td>
                            {profile.contact_state_province || "Not provided"}
                          </td>
                          <td>{formatCustomerAddress(profile)}</td>
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
      </main>
    );
  };

  return (
    <div className="app">
      {isAdminRoute ? (
        <AdminDashboard />
      ) : (
        <>
          <header className="header site-header">
            <div className="header-container site-header-inner">
              <a href="#" className="logo site-logo">
                <img
                  src={logoImage}
                  alt="Gabniks Motors"
                  className="logo-image site-logo-image"
                />
              </a>

              <nav className="nav-links main-nav">
                <a href="#home">Home</a>
                <a href="#services">Services</a>
                <a href="#about">About</a>
                <a href="#gallery">Gallery</a>
                <a href="#faq">FAQ</a>
                <a href="#contact">Contact</a>
              </nav>

              <div className="header-right-actions">
                {!session && (
                  <div className="auth-action-group">
                    <button
                      type="button"
                      className="nav-button header-auth-button"
                      onClick={() => {
                        setAuthMessage("");
                        setSignupSuccessEmail("");
                        setLoginFailedOnce(false);
                        setActiveModal("signup");
                      }}
                    >
                      Sign Up
                    </button>

                    <button
                      type="button"
                      className="nav-button header-auth-button"
                      onClick={() => {
                        setAuthMessage("");
                        setLoginFailedOnce(false);
                        setActiveModal("login");
                      }}
                    >
                      Login
                    </button>
                  </div>
                )}

                {session && (
                  <div className="account-action-group">
                    {canAccessAdmin && (
                      <a
                        href="#admin"
                        className="admin-nav-link header-admin-pill"
                      >
                        Admin
                      </a>
                    )}

                    {currentUserProfile && !showHeroWelcome && (
                      <div className="header-user-chip">
                        <span>
                          {currentUserProfile.full_name || session.user.email}
                        </span>

                        <button type="button" onClick={openProfileEditor}>
                          Edit
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      className="nav-button logout-nav-button header-logout-button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}

                <div className="header-icons site-header-icons">
                  <a
                    href={BUSINESS_PHONE_LINK}
                    className="icon-circle phone-icon"
                    aria-label="Call Gabniks Motors"
                  >
                    ☎
                  </a>

                  <a
                    href={WHATSAPP_LINK}
                    className="icon-circle message-icon"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp Gabniks Motors"
                  >
                    💬
                  </a>

                  <a
                    href={FACEBOOK_LINK}
                    className="icon-circle facebook-icon"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                  >
                    f
                  </a>
                </div>
              </div>
            </div>
          </header>

          <section id="home" className="hero-section">
            <div className="hero-background">
              <img src="/gabniks-poster.jpg" alt="Gabniks Motors services" />
            </div>
            <div className="hero-overlay"></div>

            {session && currentUserProfile && showHeroWelcome && (
              <div className="hero-user-strip">
                <div className="hero-user-card">
                  <span>Welcome Back</span>
                  <strong>
                    {currentUserProfile.full_name || session.user.email}
                  </strong>
                  <small>
                    {isDeveloper
                      ? "Developer Account"
                      : isBusinessAdmin
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
                service.
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
                    customer contact profile and booking records in one secure
                    place.
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
            href={WHATSAPP_LINK}
            className="floating-whatsapp"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            💬
          </a>

          <a href="#home" className="back-to-top" aria-label="Back to top">
            ↑
          </a>
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

            {authMessage && (
              <div className="form-message">
                <p>{authMessage}</p>

                {signupSuccessEmail && (
                  <div className="verification-actions">
                    <a
                      className="email-inbox-button"
                      href={getEmailInboxUrl(signupSuccessEmail)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {getEmailProviderLabel(signupSuccessEmail)}
                    </a>

                    <p className="verification-help-text">
                      After confirming your email, return to this website and
                      log in.
                    </p>
                  </div>
                )}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSignUp}>
              <div className="form-grid">
                <label>
                  Full Name <span className="required-mark">*</span>
                  <input
                    type="text"
                    value={signUpForm.fullName}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        fullName: event.target.value,
                      })
                    }
                    placeholder="Enter full name"
                    required
                  />
                </label>

                <label>
                  Phone Number <span className="required-mark">*</span>
                  <input
                    type="tel"
                    value={signUpForm.phone}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        phone: event.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </label>

                <label>
                  Email Address <span className="required-mark">*</span>
                  <input
                    type="email"
                    value={signUpForm.email}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        email: event.target.value,
                      })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </label>

                <label>
                  Password <span className="required-mark">*</span>
                  <input
                    type="password"
                    value={signUpForm.password}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        password: event.target.value,
                      })
                    }
                    placeholder="Create password"
                    required
                    minLength="6"
                  />
                </label>

                <label>
                  Street Address
                  <input
                    type="text"
                    value={signUpForm.contactStreet}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        contactStreet: event.target.value,
                      })
                    }
                    placeholder="Street address"
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    value={signUpForm.contactCity}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        contactCity: event.target.value,
                      })
                    }
                    placeholder="City"
                  />
                </label>

                <label>
                  State / Province
                  <input
                    type="text"
                    value={signUpForm.contactStateProvince}
                    onChange={(event) =>
                      setSignUpForm({
                        ...signUpForm,
                        contactStateProvince: event.target.value,
                      })
                    }
                    placeholder="State or province"
                  />
                </label>

                <label>
                  Preferred Contact Method
                  <select
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
              </div>

              <button className="full-submit-button" type="submit">
                Create Account
              </button>

              <button
                className="modal-switch-button"
                type="button"
                onClick={() => {
                  setAuthMessage("");
                  setSignupSuccessEmail("");
                  setLoginFailedOnce(false);
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

            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email Address
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      email: event.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      password: event.target.value,
                    })
                  }
                  placeholder="Enter password"
                  required
                />
              </label>

              <button className="full-submit-button" type="submit">
                Login
              </button>

              {loginFailedOnce && (
                <button
                  className="password-reset-button"
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Checking Email..." : "Reset Password"}
                </button>
              )}

              <button
                className="modal-switch-button"
                type="button"
                onClick={() => {
                  setAuthMessage("");
                  setSignupSuccessEmail("");
                  setLoginFailedOnce(false);
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
              onClick={() => setActiveModal(null)}
            >
              ×
            </button>

            <p className="section-label">Customer Profile</p>
            <h2>Edit Profile</h2>

            <p className="profile-edit-description">
              Update your contact details. Vehicle information is collected when
              you book a service.
            </p>

            {authMessage && <div className="form-message">{authMessage}</div>}

            <form className="auth-form" onSubmit={handleProfileUpdate}>
              <div className="form-grid">
                <label>
                  Full Name <span className="required-mark">*</span>
                  <input
                    type="text"
                    value={profileEditForm.fullName}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        fullName: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Phone Number <span className="required-mark">*</span>
                  <input
                    type="tel"
                    value={profileEditForm.phone}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        phone: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Street Address
                  <input
                    type="text"
                    value={profileEditForm.contactStreet}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        contactStreet: event.target.value,
                      })
                    }
                    placeholder="Street address"
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    value={profileEditForm.contactCity}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        contactCity: event.target.value,
                      })
                    }
                    placeholder="City"
                  />
                </label>

                <label>
                  State / Province
                  <input
                    type="text"
                    value={profileEditForm.contactStateProvince}
                    onChange={(event) =>
                      setProfileEditForm({
                        ...profileEditForm,
                        contactStateProvince: event.target.value,
                      })
                    }
                    placeholder="State or province"
                  />
                </label>

                <label>
                  Preferred Contact Method
                  <select
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
              </div>

              <div className="profile-email-note">
                <strong>Account email:</strong>{" "}
                {session?.user?.email || "Not available"}. Email/password
                changes should be handled separately for security.
              </div>

              <button className="full-submit-button" type="submit">
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
              Selected Service: <strong>{selectedService}</strong>
            </p>

            {bookingMessage && (
              <div
                className={`form-message ${
                  bookingCompleted ? "booking-success-message" : ""
                }`}
              >
                {bookingMessage}
              </div>
            )}

            {bookingCompleted ? (
              <div className="booking-complete-actions">
                <button
                  type="button"
                  className="full-submit-button"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="book-another-button"
                  onClick={handleBookAnotherService}
                >
                  Book Another Service
                </button>
              </div>
            ) : (
              <form className="booking-form" onSubmit={handleBookingSubmit}>
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
                    required
                  >
                    <option value="Flexible appointment">
                      Flexible appointment
                    </option>
                    <option value="Today">Today</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </label>

                <div className="form-grid">
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={bookingForm.fullName}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          fullName: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          phone: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          email: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Vehicle Year
                    <input
                      type="text"
                      value={bookingForm.carYear}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          carYear: event.target.value,
                        })
                      }
                      placeholder="Example: 2018"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Make
                    <input
                      type="text"
                      value={bookingForm.carMake}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          carMake: event.target.value,
                        })
                      }
                      placeholder="Example: Toyota"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Model
                    <input
                      type="text"
                      value={bookingForm.carModel}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          carModel: event.target.value,
                        })
                      }
                      placeholder="Example: Camry"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Location
                    <input
                      type="text"
                      value={bookingForm.vehicleLocation}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          vehicleLocation: event.target.value,
                        })
                      }
                      placeholder="City or service address"
                      required
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
                  Issue / Notes
                  <textarea
                    value={bookingForm.issueDescription}
                    onChange={(event) =>
                      setBookingForm({
                        ...bookingForm,
                        issueDescription: event.target.value,
                      })
                    }
                    placeholder="Briefly describe the issue"
                    required
                  ></textarea>
                </label>

                <button
                  className="full-submit-button"
                  type="submit"
                  disabled={bookingSubmitting}
                >
                  {bookingSubmitting ? "Submitting Request..." : "Submit Service Request"}
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
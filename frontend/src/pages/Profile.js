// frontend/src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/helpers";
import api from "../utils/api";

const Profile = () => {
  const { currentUser, userProfile, profileLoading, logout, changePassword } =
    useAuth();
  const navigate = useNavigate();
  const [myDocs, setMyDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    api
      .get("/profile/my-documents")
      .then((r) => setMyDocs(r.data.documents || []))
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const profile = userProfile || {};
  const displayName =
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    currentUser?.email ||
    "—";

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      await changePassword(currentPassword, newPassword);

      alert("Password changed successfully.");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);

      if (err.code === "auth/wrong-password") {
        alert("Current password is incorrect.");
      } else {
        alert(err.message || "Unable to change password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      {/* Profile Hero */}
      <section className="auth-hero">
        <div className="container">
          <h2>Your Profile</h2>
          <p>View your account details and preferences</p>
        </div>
      </section>

      {/* Profile Content */}
      <section className="auth-section" id="profilePage">
        <div className="container">
          <div className="auth-container">
            <div className="auth-form-container">
              <div className="form-header">
                <h3>Account Information</h3>
                <p>These details were provided during registration</p>
              </div>

              <div className="form-group">
                <label>Name</label>
                <div>
                  <strong id="profileName">{displayName}</strong>
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div>
                  <strong id="profileEmail">
                    {profile.email || currentUser?.email || "—"}
                  </strong>
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <div>
                  <strong id="profileRole">
                    {profileLoading
                      ? "…"
                      : (profile.userType || "").toUpperCase() || "—"}
                  </strong>
                </div>
              </div>
              <div className="form-group">
                <label>Institution</label>
                <div>
                  <strong id="profileInstitution">
                    {profileLoading ? "…" : profile.institution || "—"}
                  </strong>
                </div>
              </div>
              <div className="form-group">
                <label>Member Since</label>
                <div>
                  <strong id="profileSince">
                    {profileLoading ? "…" : formatDate(profile.createdAt)}
                  </strong>
                </div>
              </div>

              {/* My Uploaded Documents */}
              <div style={{ marginTop: "2rem" }}>
                <h4
                  style={{ color: "var(--primary-blue)", marginBottom: "1rem" }}
                >
                  My Uploaded Documents ({myDocs.length})
                </h4>
                {loadingDocs ? (
                  <p style={{ color: "var(--medium-gray)" }}>
                    Loading your documents...
                  </p>
                ) : myDocs.length === 0 ? (
                  <p style={{ color: "var(--medium-gray)" }}>
                    You haven't uploaded any documents yet.{" "}
                    <Link to="/upload">Upload one now!</Link>
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {myDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: "0.75rem 1rem",
                          background: "var(--light-gray)",
                          borderRadius: "var(--border-radius)",
                          borderLeft: "3px solid var(--primary-blue)",
                        }}
                      >
                        <div
                          style={{ fontWeight: 600, color: "var(--dark-gray)" }}
                        >
                          {doc.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--medium-gray)",
                          }}
                        >
                          Sem {doc.semester} · {doc.subjectLabel || doc.subject}{" "}
                          · {doc.viewCount || 0} views
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="form-actions"
                style={{ marginTop: "1.5rem", justifyContent: "flex-start" }}
              >
                <button
                  className="cta-button secondary"
                  onClick={() => navigate("/browse")}
                >
                  Browse Documents
                </button>
                <button
                  className="cta-button"
                  onClick={() => navigate("/upload")}
                >
                  Upload a Document
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="auth-sidebar">
              <h3>Quick Actions</h3>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">🔒</span>

                  <div className="benefit-content" style={{ width: "100%" }}>
                    <h4>Change Password</h4>

                    {!showPasswordForm ? (
                      <button
                        className="cta-button"
                        onClick={() => setShowPasswordForm(true)}
                        style={{ width: "100%" }}
                      >
                        Change Password
                      </button>
                    ) : (
                      <>
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          style={{ width: "100%", marginBottom: "10px" }}
                        />

                        <input
                          type="password"
                          placeholder="New Password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          style={{ width: "100%", marginBottom: "10px" }}
                        />

                        <input
                          type="password"
                          placeholder="Confirm Password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          style={{ width: "100%", marginBottom: "10px" }}
                        />

                        <button
                          className="cta-button"
                          onClick={handlePasswordChange}
                          disabled={passwordLoading}
                          style={{ width: "100%" }}
                        >
                          {passwordLoading ? "Updating..." : "Update Password"}
                        </button>

                        <button
                          className="cta-button secondary"
                          style={{ width: "100%", marginTop: "10px" }}
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="benefit-item">
                  <span className="benefit-icon">🚪</span>
                  <div className="benefit-content">
                    <h4>Logout</h4>
                    <p>
                      <button
                        onClick={handleLogout}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary-blue)",
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 600,
                        }}
                      >
                        Click here to sign out
                      </button>
                    </p>
                  </div>
                </div>
              </div>
              <div className="stats-preview">
                <div className="stat-preview">
                  <span className="stat-number">5,000+</span>
                  <span className="stat-label">Active Members</span>
                </div>
                <div className="stat-preview">
                  <span className="stat-number">10,000+</span>
                  <span className="stat-label">Documents Shared</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;

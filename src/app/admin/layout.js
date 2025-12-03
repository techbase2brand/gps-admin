"use client";
import AuthWrapper from "../components/AuthWrapper";

export default function AdminLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}

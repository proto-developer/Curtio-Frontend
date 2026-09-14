import { Navigate } from "react-router-dom";
import { isOwner } from "@/lib/auth/owner";

export default function OwnerRoute({ children }) {
  return isOwner()
    ? children
    : <Navigate to="/dashboard/analytics" replace />;
}

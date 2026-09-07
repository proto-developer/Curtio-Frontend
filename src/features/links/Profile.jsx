import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { updateProfile } from "@/api/auth";

export default function Profile() {

    const getStoredUser = () => {
        const data =
            localStorage.getItem("LoginUser") ||
            localStorage.getItem("user");

        if (!data) return {};

        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    };

    const storedUser = getStoredUser();

    const [formData, setFormData] = useState({
        name: storedUser.name || "",
        email: storedUser.email || "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("apiToken");

        // Validate passwords match when either is provided
        if ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        // Build payload only with fields that have values
        const payload = {};
        if (formData.name.trim()) payload.name = formData.name.trim();
        if (formData.password) payload.password = formData.password;

        if (!Object.keys(payload).length) {
            toast.error("No changes to save");
            return;
        }

        try {
            setLoading(true);
            const data = await updateProfile(payload, { token });
            if (data.success) {
                toast.success("Profile updated successfully");
                // Update stored user info
                const updatedUser = { ...storedUser, ...payload };
                localStorage.setItem("LoginUser", JSON.stringify(updatedUser));
                // Clear password fields
                setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error while updating profile");
        } finally {
            setLoading(false);
        }
    };

    const preventCopyPaste = (e) => {
        e.preventDefault();
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-6 md:py-10">
            <Toaster position="top-right" />
            <div className="w-full max-w-md md:max-w-2xl bg-white shadow-xl rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-10 border border-gray-200">

                <div className="mb-6 flex flex-col gap-3 md:gap-4">
                    <div>
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-indigo-600 hover:underline">
                            <ArrowLeft size={14} className="md:size-4" /> Back to Dashboard
                        </Link>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Profile Settings
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                            Manage your account information
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <p className="text-xs md:text-sm text-indigo-600 font-medium py-1.5 px-3 border border-indigo-600 rounded-full bg-indigo-600/10 inline-flex items-center max-w-full truncate">
                            <Mail size={14} className="md:size-4 mr-1.5 shrink-0" />
                            <span className="truncate">{formData.email}</span>
                        </p>

                        <p className="text-xs md:text-sm text-green-600 font-medium py-1.5 px-3 border border-green-600 rounded-full bg-green-600/10 inline-flex items-center">
                            <ShieldCheck size={14} className="md:size-4 mr-1.5 shrink-0" />
                            Verified
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

                    <div>
                        <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">
                            Full Name
                        </label>

                        <div className="flex items-center border border-gray-300 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                            <User size={18} className="md:size-5 text-gray-400 mr-2 md:mr-3 shrink-0" />

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                className="w-full outline-none bg-transparent text-xs md:text-sm text-gray-800 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                        <div>
                            <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">
                                New Password
                            </label>

                            <div className="flex items-center border border-gray-300 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition">

                                <Lock size={18} className="md:size-5 text-gray-400 mr-2 md:mr-3 shrink-0" />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="New password"
                                    className="w-full outline-none bg-transparent text-xs md:text-sm text-gray-800 placeholder-gray-400"
                                    onCopy={preventCopyPaste}
                                    onPaste={preventCopyPaste}
                                    onCut={preventCopyPaste}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} className="md:size-5" />
                                    ) : (
                                        <Eye size={18} className="md:size-5" />
                                    )}
                                </button>

                            </div>
                        </div>

                        <div>
                            <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">
                                Confirm Password
                            </label>

                            <div className="flex items-center border border-gray-300 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition">

                                <Lock size={18} className="md:size-5 text-gray-400 mr-2 md:mr-3 shrink-0" />

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    className="w-full outline-none bg-transparent text-xs md:text-sm text-gray-800 placeholder-gray-400"
                                    onCopy={preventCopyPaste}
                                    onPaste={preventCopyPaste}
                                    onCut={preventCopyPaste}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} className="md:size-5" />
                                    ) : (
                                        <Eye size={18} className="md:size-5" />
                                    )}
                                </button>

                            </div>
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 transition-all text-xs md:text-sm text-white font-semibold py-3 rounded-xl md:rounded-2xl disabled:opacity-60 shadow-sm"
                    >
                        {loading ? "Updating..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}
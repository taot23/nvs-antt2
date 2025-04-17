import { useState } from "react";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user } = useAuth();

  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-md mx-auto">
          {/* Auth Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex -mb-px">
              <button
                onClick={() => setActiveTab("login")}
                className={`py-2 px-4 text-center border-b-2 flex-1 font-medium transition-colors ${
                  activeTab === "login"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`py-2 px-4 text-center border-b-2 flex-1 font-medium transition-colors ${
                  activeTab === "register"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Cadastro
              </button>
            </div>
          </div>

          {/* Login/Register Form Panels */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === "login" ? (
              <LoginForm onSuccess={() => {}} />
            ) : (
              <RegisterForm
                onSuccess={() => {
                  setActiveTab("login");
                }}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

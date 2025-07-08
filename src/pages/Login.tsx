"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { LoginForm } from "@/components/auth/LoginForm"
import { SignupForm } from "@/components/auth/SignupForm"
import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Stethoscope } from "lucide-react"

const Login = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const location = useLocation()
  const defaultTab = location?.state?.defaultTab || "login"

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    const isLoggedIn = sessionStorage.getItem("isLoggedIn")
    if (isLoggedIn === "true" && userType) {
      switch (userType) {
        case "pharmacy":
          navigate("/pharmacy/products")
          break
        case "admin":
          navigate("/admin/dashboard")
          break
        case "hospital":
          navigate("/hospital/dashboard")
          break
        case "group":
          navigate("/group/dashboard")
          break
        default:
          toast({
            title: "Error",
            description: "Invalid user type. Please log in again.",
            variant: "destructive",
          })
          sessionStorage.clear()
      }
    }
  }, [navigate, toast])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Fixed Image Section */}
      <div className="hidden lg:flex lg:w-1/2">
        <div className="fixed top-0 left-0 h-screen w-1/2">
          <div className="relative h-full w-full">
            <img
              src="/lovable-uploads/320ef3c7-e13e-4702-b3ff-d861e32d31ea.png"
              alt="Healthcare Medicine Bottles"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-white/10 to-transparent" />
            <div className="absolute top-[30%] left-0 right-0 p-12">
              <div className="max-w-lg">
                <div className="flex items-center mb-6">
                  <div className="h-16 w-14 mr-4">
                    <img src="/logo.png" alt="Logo" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                      9RX
                    </h1>
                    <p className="text-gray-600 font-medium">
                      Healthcare Management Platform
                    </p>
                  </div>
                </div>

                <h2 className="text-4xl font-bold mb-4 text-gray-800 leading-tight">
                  Your Trusted{" "}
                  <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                    Healthcare Partner
                  </span>
                </h2>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Streamline your pharmacy operations with our comprehensive
                  management system. Trusted by healthcare professionals
                  nationwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Scrollable Form Section */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto bg-gray-50 px-4 sm:px-6 lg:px-8 relative">
        {/* Blurred Circles */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md mx-auto py-10 z-10 relative">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  9RX
                </h1>
                <p className="text-gray-600">Healthcare Platform</p>
              </div>
            </div>
          </div>

          {/* Tabs Card */}
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold text-center text-transparent bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center text-gray-600 text-base">
                Sign in to your account or create a new one to get started
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-8">
              <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-12">
                  <TabsTrigger
                    value="login"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-medium"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-600 font-medium"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-8">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="signup" className="space-y-4 mt-8">
                  <SignupForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Login

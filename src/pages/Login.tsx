import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const location = useLocation();
  const defaultTab = location?.state?.defaultTab || "login";

  useEffect(() => {
    // Check if user is already logged in
    const userType = sessionStorage.getItem("userType");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true" && userType) {
      // console.log('User already logged in:', userType);
      // Redirect based on user type
      switch (userType) {
        case "pharmacy":
          navigate("/pharmacy/products");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "hospital":
          navigate("/hospital/dashboard");
          break;
        case "group":
          navigate("/group/dashboard");
          break;
        default:
          console.error("Unknown user type:", userType);
          toast({
            title: "Error",
            description: "Invalid user type. Please log in again.",
            variant: "destructive",
          });
          // Clear invalid session
          sessionStorage.clear();
      }
    }
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to 9RX</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

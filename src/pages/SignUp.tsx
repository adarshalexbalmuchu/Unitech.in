import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to confirm your account." });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mb-4">
            <img src={`${import.meta.env.BASE_URL}unitech-logo.png`} alt="Unitech India" className="h-9 mx-auto" />
          </Link>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Sign up for a Unitech account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Sign Up"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;

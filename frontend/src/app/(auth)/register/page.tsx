"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import {
  Zap,
  ArrowRight,
  Moon,
  Sun,
  CheckCircle,
  Shield,
  Clock,
  Sparkles,
  Star,
} from "lucide-react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const registerSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

  type RegisterForm = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      // Auto-generate username and tenant_name from email
      const username = data.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
      const tenantName = data.email.split("@")[1].split(".")[0];

      const res = await api.post("/auth/register", {
        ...data,
        full_name: username,
        username,
        tenant_name: tenantName,
      });
      const { access_token, refresh_token } = res.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      const meRes = await api.get("/auth/me");
      const tenantRes = await api.get("/tenants/current");

      login(meRes.data, tenantRes.data, access_token, refresh_token);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: CheckCircle, text: "Free for teams up to 5 members" },
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Clock, text: "Set up in under 2 minutes" },
    { icon: Sparkles, text: "No credit card required" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FlowDesk</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">
              Start managing projects like a pro. It&apos;s free and takes less than a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                placeholder="you@company.com"
                type="email"
                {...register("email")}
                className="h-11"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <Input
                placeholder="At least 8 characters"
                type="password"
                {...register("password")}
                className="h-11"
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t">
            <p className="text-xs text-muted-foreground text-center mb-4">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-muted/50 border-l">
        <div className="max-w-md p-8">
          <h2 className="text-2xl font-bold mb-6">
            Why teams love FlowDesk
          </h2>
          <div className="space-y-6">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-xl bg-background border">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic mb-4">
              &ldquo;FlowDesk replaced 3 different tools for our team. The simplicity
              and power combination is exactly what we needed.&rdquo;
            </p>
            <div>
              <p className="text-sm font-medium">Alex Kim</p>
              <p className="text-xs text-muted-foreground">Engineering Manager at TechCorp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        )}
      </div>
    </div>
  );
}



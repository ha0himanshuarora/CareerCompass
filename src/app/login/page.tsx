
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Compass, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  
  useEffect(() => {
    if (searchParams.get('verified') === 'false') {
        setShowVerificationMessage(true);
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowVerificationMessage(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // We need to check the emailVerified status from the fresh credential
      if (!userCredential.user.emailVerified) {
        toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please verify your email address before logging in. A verification link was sent to your inbox.",
        });
        // Sign out the user to prevent them from being in a logged-in but unverified state
        await signOut(auth);
        setIsLoading(false);
        return;
      }
      // If verified, the AuthProvider will handle the redirect
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password.",
      });
       setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <Link href="/" className="inline-block">
                <div className="flex justify-center items-center gap-2 mb-4">
                <Compass className="text-primary size-8" />
                <CardTitle className="text-2xl font-headline">CareerCompass</CardTitle>
                </div>
            </Link>
            <CardDescription>Welcome back! Please enter your details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             {showVerificationMessage && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Verify Your Email</AlertTitle>
                    <AlertDescription>
                        A verification link has been sent to your email. Please verify before logging in.
                    </AlertDescription>
                </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="student@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="underline font-medium text-primary">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

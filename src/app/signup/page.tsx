

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Compass, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleSelector } from "@/components/RoleSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Student fields
  const [instituteName, setInstituteName] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Recruiter fields
  const [hrContact, setHrContact] = useState('');
  const [contact, setContact] = useState('');
  const [companyName, setCompanyName] = useState('');

  // TPO fields
  const [contactNumber, setContactNumber] = useState('');


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
        toast({
            variant: "destructive",
            title: "Signup Failed",
            description: "Please select a role.",
        });
        return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: "Passwords do not match.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      
      const userData: any = {
        uid: user.uid,
        name,
        email,
        role,
      };

      if (role === 'student') {
        userData.instituteName = instituteName;
        userData.branch = branch;
        userData.graduationYear = graduationYear;
      } else if (role === 'recruiter') {
        userData.companyName = companyName;
        userData.hrContact = hrContact;
        userData.contact = contact;
      } else if (role === 'tpo') {
        userData.instituteName = instituteName;
        userData.contactNumber = contactNumber;
      }

      await setDoc(doc(db, "users", user.uid), userData);

      router.push('/dashboard');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderFormFields = () => {
    const years = Array.from({ length: 2034 - 1990 + 1 }, (_, i) => 1990 + i);

    switch(role) {
      case 'student':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" placeholder="Sonya Nag" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="sonya@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="instituteName">Institute Name</Label><Input id="instituteName" required value={instituteName} onChange={(e) => setInstituteName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="branch">Branch</Label><Input id="branch" required value={branch} onChange={(e) => setBranch(e.target.value)} /></div>
            <div className="grid gap-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Select onValueChange={setGraduationYear} value={graduationYear} required>
                    <SelectTrigger id="graduationYear" className="w-[180px]">
                        <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        )
      case 'recruiter':
        return (
           <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="john.doe@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="companyName">Company Name</Label><Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="hrContact">HR Contact Email</Label><Input id="hrContact" type="email" required value={hrContact} onChange={(e) => setHrContact(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="contact">Contact Number</Label><Input id="contact" type="tel" required value={contact} onChange={(e) => setContact(e.target.value)} /></div>
          </div>
        )
      case 'tpo':
        return (
           <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" placeholder="Jane Smith" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="placement@institute.edu" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="instituteName">Institute Name</Label><Input id="instituteName" required value={instituteName} onChange={(e) => setInstituteName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="contactNumber">Contact Number</Label><Input id="contactNumber" type="tel" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} /></div>
          </div>
        )
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <form onSubmit={handleSignup}>
          <CardHeader className="text-center">
             <Link href="/" className="inline-block">
                <div className="flex justify-center items-center gap-2 mb-4">
                <Compass className="text-primary size-8" />
                <CardTitle className="text-2xl font-headline">CareerCompass</CardTitle>
                </div>
            </Link>
            <CardDescription>Create an account to get started. First, select your role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="role">I am a...</Label>
              <RoleSelector onValueChange={setRole} value={role} />
            </div>
            
            {role && (
              <div className="border-t pt-6">
                {renderFormFields()}
              </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {role && (
              <Button className="w-full max-w-xs" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="underline font-medium text-primary">
                Log In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}




export interface Job {
    id: string;
    jobTitle: string;
    jobType: "Job" | "Internship";
    description: string;
    salary: number;
    deadline: string;
    eligibility: string;
    skills: string[];
    recruiterId: string;
    companyName: string;
    createdAt: any; // Firestore Timestamp
    status: 'open' | 'closed';
    applicants?: string[]; // Array of student UIDs
    applicantsCount?: number;
}

export interface Interview {
  id: string;
  candidateName: string;
  studentId: string;
  jobTitle: string;
  companyName: string;
  interviewDate: any; // Firestore Timestamp
  type: string;
}

export interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    studentId: string;
    recruiterId: string;
    status: 'applied' | 'test' | 'shortlisted' | 'interview' | 'offer' | 'joined' | 'rejected';
    appliedDate: any; // Firestore timestamp
}

export interface Student {
    uid: string;
    name: string;
    email: string;
    role: 'student';
    instituteName: string;
    branch: string;
    graduationYear: string;
    isPlaced?: boolean;
}

export interface Recruiter {
    uid: string;
    name: string;
    email: string;
    role: 'recruiter';
    companyName: string;
    hrContact: string;
    contact: string;
}

export interface TPO {
    uid: string;
    name: string;
    email: string;
    role: 'tpo';
    instituteName: string;
    contactNumber: string;
}

export interface Collaboration {
    id: string;
    recruiterId: string;
    recruiterName: string;
    companyName: string;
    tpoId: string;
    tpoName: string;
    instituteName: string;
    status: 'pending' | 'accepted' | 'rejected';
    requestedAt: any; // Firestore timestamp
}

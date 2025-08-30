
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
    applicants?: any[]; // Array of student UIDs
    applicantsCount?: number;
}

export interface Interview {
  id: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: any; // Firestore Timestamp
  type: string;
}

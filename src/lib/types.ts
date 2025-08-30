




export interface Resume {
    id: string;
    studentId: string;
    title: string;
    template: 'onyx' | 'opal' | 'topaz';
    personalInfo: {
        name: string;
        email: string;
        mobile: string;
        enrollment: string;
        branch: string;
        passingYear: string;
        linkedin?: string;
        github?: string;
    };
    careerObjective: string;
    skills: string[];
    projects: {
        title: string;
        description: string;
        githubLink?: string;
        liveLink?: string;
    }[];
    academicDetails: {
        degree: string;
        institute: string;
        cgpa: string;
        year: string;
    }[];
    experience?: {
        company: string;
        role: string;
        duration: string;
        description: string;
    }[];
    certifications?: {
        name: string;
        issuer: string;
        date: string;
        link?: string;
    }[];
    createdAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
}


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
    resumeId: string;
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
    initiatedBy: 'recruiter' | 'tpo';
}

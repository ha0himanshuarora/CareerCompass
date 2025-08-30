

export interface Project {
    title: string;
    description: string;
    skillsUsed: string[];
    duration?: string;
    githubLink?: string;
    liveLink?: string;
}

export interface AcademicRecord {
    level: "10th" | "12th" | "Undergraduate" | "Postgraduate";
    degree: string;
    institute: string;
    cgpa: string;
    year: string;
}

export interface Certification {
    name: string;
    issuer: string;
    date: string;
    link?: string;
}

export interface Skill {
    name: string;
    type: 'Technical' | 'Soft';
    progress?: number;
}

export interface Experience {
    company: string;
    role: string;
    duration: string;
    description: string;
}

export interface Student {
    uid: string;
    name: string;
    email: string;
    role: 'student';
    // Personal Info
    phone?: string;
    address?: string;
    links: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
    };
    // Academic Info
    instituteName: string;
    branch: string;
    graduationYear: string;
    rollNumber?: string;
    academicRecords: AcademicRecord[];
    // Professional Info
    careerObjective?: string;
    skills: Skill[];
    projects: Project[];
    experience?: Experience[];
    certifications: Certification[];
    // Placement Data
    jobPreferences?: {
        domains: string[];
        locations: string[];
        packageExpectation: string;
    };
    isPlaced: boolean; 
}


export interface Resume {
    id: string;
    studentId: string;
    title: string;
    template: 'onyx' | 'opal' | 'topaz';
    // Data is now a snapshot from the student's profile at time of creation
    personalInfo: Student['links'] & { name: string; email: string; phone?: string; branch: string; };
    careerObjective?: string;
    skills: Skill[];
    projects: Project[];
    academicDetails: AcademicRecord[];
    experience?: Experience[];
    certifications?: Certification[];
    createdAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
}

// New Detailed Job Interface based on user schema

export interface Location {
    type: "Onsite" | "Remote" | "Hybrid";
    address: string;
}

export interface JobDetails {
    title: string;
    jobType: "Full-time" | "Internship" | "PPO" | "Part-time" | "Contract";
    description: string;
    location: Location;
    domain: string;
    roleCategory: string;
    workMode: "Day Shift" | "Night Shift" | "Rotational";
    duration: string; // only for internships/contracts
    startDate: any; // Date
    applicationDeadline: any; // Date
    joiningDate?: any; // Date
}

export interface EligibilityCriteria {
    cgpa: number;
    backlogsAllowed: boolean;
    allowedBacklogCount?: number;
    departmentsAllowed: string[];
    yearOfPassing: number;
    genderPreference?: "Any" | "Male" | "Female";
    attemptLimit?: number;
    skillRequirements: string[];
    certificationsPreferred?: string[];
    priorExperience?: string;
}

export interface SalaryAndBenefits {
    ctc: string;
    stipend?: string; // for internship only
    ppo?: boolean;
    ppoCtc?: string;
    bonus?: string;
    perks?: string[];
}

export interface TestDetails {
    testType: "Aptitude" | "Coding" | "English" | "Reasoning" | "Company-specific";
    testDate: any; // Date
    mode: "Online" | "Offline";
    duration: string;
    linkOrVenue: string;
}

export interface InterviewRound {
    roundNumber: number;
    roundType: "Technical" | "HR" | "Group Discussion" | "Case Study";
    date: any; // Date
    mode: "Online" | "Offline";
    venueOrLink: string;
}

export interface ApplicationProcess {
    resumeRequired: boolean;
    resumeVersionChoice: boolean;
    coverLetterRequired: boolean;
    additionalDocuments?: string[];
    testRequired: boolean;
    testDetails?: TestDetails;
    interviewRounds?: InterviewRound[];
    selectionProcessFlow?: string;
}

export interface OfferDetails {
    offerType: "Single" | "Multiple" | "Tier-based";
    acceptanceDeadline: any; // Date
    joiningLocation: string;
    bondOrServiceAgreement: boolean;
    bondDetails?: string;
}

export interface TpoOverrides {
    eligibilityRuleEnforcement: boolean;
    tierRestriction: boolean;
    maxOffersAllowed: number;
}

export interface JobMetadata {
    postedBy: string; // recruiterId
    postedOn: any; // Firestore timestamp
    lastUpdated: any; // Firestore timestamp
    status: "Draft" | "Pending Approval" | "Open" | "Closed" | "Filled";
    applicantCount: number;
    shortlistedCount: number;
    hiredCount: number;
}

export interface Job {
    id: string; // Same as jobId
    companyId: string; // Ref: Company/Recruiter profile
    tpoApproved: boolean;
    jobDetails: JobDetails;
    eligibilityCriteria: EligibilityCriteria;
    salaryAndBenefits: SalaryAndBenefits;
    applicationProcess: ApplicationProcess;
    offerDetails: OfferDetails;
    tpoOverrides: TpoOverrides;
    metadata: JobMetadata;
    // For backward compatibility with old components that might still use these
    jobTitle?: string;
    companyName?: string;
    status?: 'open' | 'closed';
    applicants?: string[];
    deadline?: string;
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
    status: 'applied' | 'shortlisted' | 'interview' | 'offer' | 'joined' | 'rejected';
    appliedDate: any; // Firestore timestamp
    offerLetterId?: string;
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

// Test Module Interfaces
export interface Question {
    questionText: string;
    options: string[];
    correctOption: number; // 0-indexed
}

export interface Test {
    id: string;
    title: string;
    type: 'mock' | 'company';
    createdBy: string; // uid of TPO or Recruiter
    instituteName?: string; // For TPO tests
    companyName?: string; // For Recruiter tests
    duration: number; // in minutes
    passingScore?: number; // For company tests
    questions: Question[];
    createdAt: any; // Firestore Timestamp
}

export interface StudentTest {
    id: string;
    studentId: string;
    testId: string;
    assignedBy: string; // uid of TPO or Recruiter
    status: 'pending' | 'inprogress' | 'completed';
    startedAt?: any; // Firestore Timestamp
    completedAt?: any; // Firestore Timestamp
    score?: number;
    jobId?: string; // Link the test assignment to the job
}

export interface StudentTestResult {
    id: string;
    studentTestId: string;
    studentId: string;
    testId: string;
    testType: 'mock' | 'company';
    answers: { questionIndex: number, selectedOption: number }[];
    score: number;
    totalQuestions: number;
    submittedAt: any; // Firestore timestamp
}

export interface OfferLetter {
    id: string;
    applicationId: string;
    jobId: string;
    studentId: string;
    recruiterId: string;
    issuedAt: any; // Firestore Timestamp
    content: {
        studentName: string;
        companyName: string;
        recruiterName: string;
        recruiterEmail: string;
        jobTitle: string;
        joiningDate: any; // Date
        ctc: string;
        stipend?: string;
    };
}

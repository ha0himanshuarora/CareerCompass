
"use client";

import React from "react";
import { OfferLetter } from "@/lib/types";
import { format } from "date-fns";
import { Compass } from "lucide-react";

interface OfferLetterPreviewProps {
  offerLetter: OfferLetter;
}

export const OfferLetterPreview = React.forwardRef<HTMLDivElement, OfferLetterPreviewProps>(({ offerLetter }, ref) => {
    const { content } = offerLetter;
    const issuedDate = offerLetter.issuedAt?.toDate ? format(offerLetter.issuedAt.toDate(), "PPP") : "Date not available";
    const joiningDate = content.joiningDate?.toDate ? format(content.joiningDate.toDate(), "PPP") : "Date not available";

    return (
        <div ref={ref} className="bg-white text-gray-800 p-12 font-serif text-sm leading-relaxed A4-aspect-ratio">
            <header className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{content.companyName}</h1>
                </div>
                <div className="flex items-center gap-2 text-primary">
                    <Compass />
                    <span className="font-bold">CareerCompass</span>
                </div>
            </header>

            <main>
                <p className="text-right mb-8">{issuedDate}</p>

                <p className="mb-4">
                    <strong>{content.studentName}</strong><br/>
                    [Student Address from Profile - Placeholder]
                </p>

                <h2 className="text-lg font-bold mb-6 text-center underline underline-offset-4">OFFER OF EMPLOYMENT</h2>

                <p className="mb-4">Dear {content.studentName},</p>

                <p className="mb-4">
                    Following our recent discussions, we are delighted to offer you the position of <strong>{content.jobTitle}</strong> with {content.companyName}.
                </p>

                <p className="mb-4">
                    Your employment will commence on <strong>{joiningDate}</strong>. You will be based at our office at [Company Address - Placeholder].
                </p>

                <p className="mb-4">
                    Your compensation package will be <strong>{content.ctc}</strong> per annum. 
                    {content.stipend && ` During your internship/probation period, you will receive a stipend of ${content.stipend}. `}
                    Further details of your compensation and benefits are attached in Annexure A.
                </p>
                
                <p className="mb-4">
                    This offer is contingent upon the successful completion of your background verification and your agreement to the terms and conditions outlined in the employment agreement.
                </p>
                
                <p className="mb-8">
                    We are excited about the prospect of you joining our team. We believe you have the skills and experience to be a valuable asset to our company. Please sign and return a copy of this letter by [Offer Acceptance Deadline - Placeholder] to confirm your acceptance of this offer.
                </p>

                <div className="flex justify-between items-end mt-20">
                    <div>
                        <p>Sincerely,</p>
                        <p className="mt-8 border-t pt-2">
                            <strong>{content.recruiterName}</strong><br/>
                            HR Department<br/>
                            {content.companyName}<br/>
                            {content.recruiterEmail}
                        </p>
                    </div>
                    <div>
                        <p className="mt-8 border-t pt-2">
                            Accepted and Agreed,<br/>
                            <strong>{content.studentName}</strong>
                        </p>
                    </div>
                </div>
            </main>
            
            <footer className="text-center text-xs text-gray-400 mt-12 pt-4 border-t">
                <p>{content.companyName} | [Company Address] | [Company Website]</p>
            </footer>
        </div>
    );
});

OfferLetterPreview.displayName = "OfferLetterPreview";

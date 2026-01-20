import { useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface FAQItem {
    question: string
    answer: string
}

const FAQS: FAQItem[] = [
    {
        question: "How do I check my attendance?",
        answer: "You can check your attendance by logging into the student portal and navigating to the 'Attendance' section. The system updates attendance records daily."
    },
    {
        question: "When are the semester exams scheduled?",
        answer: "Semester exams typically take place in December (Odd Semesters) and May (Even Semesters). The detailed datasheet is published on the notice board 2 weeks prior to exams."
    },
    {
        question: "How can I apply for a scholarship?",
        answer: "Scholarship applications open at the beginning of each academic year. You can download the application form from the 'Documents' section or collect it from the admin office."
    },
    {
        question: "What is the procedure for library book renewal?",
        answer: "Books can be renewed by visiting the library physically or through the online library portal using your student ID. Books can be renewed up to 2 times if there are no reservations."
    },
    {
        question: "Can I change my elective subject?",
        answer: "Changes to elective subjects are allowed only within the first 2 weeks of the semester. You need to submit a written request to your Head of Department (HOD)."
    },
]

export function FAQPage() {
    return (
        <DashboardLayout variant="student">
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Frequently Asked Questions</h1>
                        <p className="text-text-muted">Find answers to common queries</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <Accordion key={index} item={faq} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}

function Accordion({ item }: { item: FAQItem }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Card className="overflow-hidden transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-background-secondary/50 transition-colors"
            >
                <span className="font-medium text-text">{item.question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                )}
            </button>
            <div
                className={clsx(
                    "px-4 text-sm text-text-muted bg-background-secondary/20 transition-all duration-200 ease-in-out border-t border-border",
                    isOpen ? "max-h-40 py-4 opacity-100" : "max-h-0 py-0 opacity-0 border-t-0"
                )}
            >
                {item.answer}
            </div>
        </Card>
    )
}

'use client'

import ReviewerLayout from '@/components/reviewers/ReviewerLayout';

export default function ReviewGuideline() {
    return (
        <>
        <ReviewerLayout>
          <div className="min-h-screen bg-[#faf7fc] p-4">
            <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] mt-8">
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-center text-[#2b1229] mb-6">TETFund IBR Proposal Grading Template</h1>

                {/* Basic Information Section */}
                <div className="grid grid-cols-1 gap-4 mb-8">
                    <div className="space-y-2 text-[#2b1229]">
                        <p><span className="font-semibold">Department/Faculty:</span> Computer Science</p>
                        <p><span className="font-semibold">Proposal Title:</span> Research on AI Applications</p>
                        <p><span className="font-semibold">Reviewer Name:</span> Dr. John Smith</p>
                        <p><span className="font-semibold">Date of Review:</span> 01/01/2024</p>
                    </div>
                </div>

                {/* Scoring Table */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#4a0340] mb-4">Scoring Rubric (Total: 100 points)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-[#e6d9e6]">
                            <thead>
                                <tr className="bg-[#f4eef3]">
                                    <th className="border border-[#e6d9e6] p-2 text-[#2b1229]">Evaluation Criteria</th>
                                    <th className="border border-[#e6d9e6] p-2 text-[#2b1229]">Description</th>
                                    <th className="border border-[#e6d9e6] p-2 text-[#2b1229]">Max Score</th>
                                    <th className="border border-[#e6d9e6] p-2 text-[#2b1229]">Score Given</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Relevance to National/Institutional Priorities', "Alignment with Nigeria's national development goals or UNIBEN research priorities", 10, '8'],
                                    ['Originality and Innovation', 'Novelty of research idea; advancement of knowledge; creativity', 15, '12'],
                                    ['Clarity of Research Problem and Objectives', 'Clearly defined problem statement and SMART objectives', 10, '9'],
                                    ['Methodology', 'Appropriateness, rigor, and feasibility of the research design, tools, and approach', 15, '13'],
                                    ['Literature Review and Theoretical Framework', 'Sound grounding in existing literature; clear conceptual framework', 10, '8'],
                                    ['Team Composition and Expertise', 'Appropriateness of team, interdisciplinary balance, qualifications', 10, '9'],
                                    ['Feasibility and Timeline', 'Realistic scope, milestones, and timeline within funding duration', 10, '8'],
                                    ['Budget Justification and Cost-Effectiveness', 'Clear and justified budget aligned with project goals', 10, '9'],
                                    ['Expected Outcomes and Impact', 'Potential contributions to policy, community, academia, industry', 5, '4'],
                                    ['Sustainability and Scalability', 'Potential for continuation, replication, or scale-up beyond funding', 5, '4'],
                                ].map((row, index) => (
                                    <tr key={index} className="border border-[#e6d9e6]">
                                        <td className="border border-[#e6d9e6] p-2 font-medium text-[#2b1229]">{row[0]}</td>
                                        <td className="border border-[#e6d9e6] p-2 text-[#6b5566]">{row[1]}</td>
                                        <td className="border border-[#e6d9e6] p-2 text-center text-[#2b1229]">{row[2]}</td>
                                        <td className="border border-[#e6d9e6] p-2 text-center text-[#2b1229]">{row[3]}</td>
                                    </tr>
                                ))}
                                <tr className="bg-[#f4eef3] font-bold">
                                    <td colSpan={2} className="border border-[#e6d9e6] p-2 text-right text-[#2b1229]">Total Score:</td>
                                    <td className="border border-[#e6d9e6] p-2 text-center text-[#2b1229]">100</td>
                                    <td className="border border-[#e6d9e6] p-2 text-center text-[#2b1229]">84</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Comments Section */}
                <div>
                    <h2 className="text-xl font-semibold text-[#4a0340] mb-4">Reviewer's Comments:</h2>
                    <p className="mb-2 text-[#6b5566]">(Strengths, weaknesses, and recommendations for improvement)</p>
                    <div className="w-full h-40 p-2 border border-[#e0d3e0] rounded-md bg-[#f4eef3] text-[#2b1229] overflow-y-auto">
                        The proposal demonstrates strong alignment with institutional priorities and has a well-structured methodology. However, the innovation aspect could be strengthened, and the budget allocation needs more detailed justification. Recommend clarifying the sustainability plan and expanding on potential industry partnerships.
                    </div>
                </div>
            </div>
        </div>
       </ReviewerLayout>
        </>
    )
}
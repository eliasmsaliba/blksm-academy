/**
 * One-off script: migrates the 6 already-imported Foundation Academy / Course 1 /
 * Module 1 lessons from the old flat `{ body: string }` content shape into the
 * new `structured-v1` shape, and creates real MCQ/True-False Knowledge Check
 * quizzes for the 4 lessons that have one. Idempotent — safe to re-run.
 *
 * Run once against production: node dist-seed/migrate-foundation-lesson-content.js
 */
import { PrismaClient, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

interface KnowledgeCheckQuestion {
  questionType: "MCQ_SINGLE" | "TRUE_FALSE";
  promptText: string;
  options: { optionText: string; isCorrect: boolean }[];
}

interface LessonMigration {
  title: string;
  content: {
    format: "structured-v1";
    lessonCode?: string;
    competenciesDeveloped?: string[];
    introduction?: string;
    learningOutcomes?: string[];
    leadershipThought?: string;
    sections: { heading: string; body: string }[];
    reflection?: string;
  };
  knowledgeCheck?: {
    title: string;
    passMarkPercent: number;
    maxAttempts: number;
    questions: KnowledgeCheckQuestion[];
  };
}

const LESSONS: LessonMigration[] = [
  {
    title: "Welcome to BLKSM Academy",
    content: {
      format: "structured-v1",
      introduction:
        "Welcome to BLKSM.\nToday marks the beginning of your professional journey with our organisation.\nWhether you are joining the Accounts team, Marketing, Operations or any future department, every employee begins in exactly the same place—BLKSM Academy.\nThis is not simply an induction programme.\nIt is the foundation of your professional development.\nThroughout your career you will return to BLKSM Academy to develop new skills, gain certifications and prepare for greater responsibilities.\nEvery lesson you complete contributes to your growth as an event professional and to the success of the company.",
      sections: [
        {
          heading: "Why BLKSM Academy Exists",
          body: "Professional event management is a demanding industry.\nEvery project involves clients, suppliers, budgets, deadlines, venues, technology, logistics and people.\nSuccess depends on more than creativity.\nIt depends on preparation.\nConsistency.\nCommunication.\nLeadership.\nDiscipline.\nThe purpose of BLKSM Academy is to ensure that every employee develops these capabilities through structured learning.\nRather than relying on individual experience alone, the Academy provides a common professional standard that guides the way we think, communicate and work.",
        },
        {
          heading: "Our Commitment to Learning",
          body: "At BLKSM we believe that learning never ends.\nEvery completed course prepares you for the next level of responsibility.\nEvery project provides an opportunity to improve.\nEvery challenge is a learning opportunity.\nProfessional growth is not measured by the number of years you have worked.\nIt is measured by your willingness to improve every day.",
        },
        {
          heading: "Your Commitment",
          body: "As a learner you are expected to:\n- Complete all assigned learning.\n- Participate honestly in assessments.\n- Apply what you learn in your daily work.\n- Ask questions when unsure.\n- Continuously improve your knowledge and skills.\n- Represent BLKSM professionally.",
        },
        {
          heading: "The BLKSM Promise",
          body: "In return, BLKSM commits to investing in your development.\nWe will provide structured learning, practical opportunities, coaching and continuous support to help you succeed.\nYour success contributes directly to the success of our clients and our organisation.",
        },
        {
          heading: "Key Takeaways",
          body: "After completing this lesson you should understand:\n- Why BLKSM Academy exists.\n- Why every employee starts here.\n- Why continuous learning is essential.\n- Your responsibilities as a learner.",
        },
      ],
      reflection:
        "Think about the following question before continuing.\nWhat kind of professional do you want to become during your career at BLKSM?\nWrite your answer in your learner journal.",
    },
    knowledgeCheck: {
      title: "Knowledge Check 1",
      passMarkPercent: 70,
      maxAttempts: 3,
      questions: [
        {
          questionType: "MCQ_SINGLE",
          promptText: "Why does every employee complete Foundation Academy?",
          options: [
            { optionText: "To complete HR paperwork", isCorrect: false },
            { optionText: "To establish a shared professional standard across the organisation", isCorrect: true },
            { optionText: "To learn payroll procedures", isCorrect: false },
            { optionText: "To complete probation", isCorrect: false },
          ],
        },
        {
          questionType: "TRUE_FALSE",
          promptText: "Learning at BLKSM ends after Foundation Academy.",
          options: [
            { optionText: "True", isCorrect: false },
            { optionText: "False", isCorrect: true },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "Which statement best describes BLKSM Academy?",
          options: [
            { optionText: "An optional training platform", isCorrect: false },
            { optionText: "A company induction programme only", isCorrect: false },
            { optionText: "The official learning and professional development platform of BLKSM", isCorrect: true },
            { optionText: "A document storage system", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    title: "The Story of BLKSM",
    content: {
      format: "structured-v1",
      introduction:
        "Every successful organisation begins with a purpose.\nCompanies that simply sell products compete on price.\nCompanies that solve problems build lasting relationships.\nBLKSM was established with the belief that event management should be more than coordinating suppliers and booking venues.\nEvery event has the potential to create meaningful experiences that inspire people, strengthen brands, build communities and celebrate achievements.\nOur role is to transform ideas into experiences that leave a lasting impression.",
      sections: [
        {
          heading: "What We Do",
          body: "BLKSM is a professional event management company that plans, manages and delivers live experiences from concept through to post-event evaluation.\nOur services span the full event lifecycle, including strategic planning, creative development, production coordination, commercial management, venue operations, marketing, guest experience and event delivery.\nRather than treating these functions as separate activities, BLKSM integrates them into one coordinated delivery model.\nEvery department contributes to a single objective:\nDelivering exceptional experiences for clients and their audiences.",
        },
        {
          heading: "Our Difference",
          body: "Many companies organise events.\nBLKSM builds systems that allow events to be delivered consistently, professionally and at scale.\nOur success is measured not only by how an event looks, but by:\n- How efficiently it was managed.\n- How confidently the client felt throughout the project.\n- How effectively our teams collaborated.\n- How safely the event was delivered.\n- How memorable the experience was for every attendee.\nExcellence is achieved through preparation, teamwork and disciplined execution—not by chance.",
        },
        {
          heading: "Your Role in the Story",
          body: "Every employee contributes to the BLKSM story.\nWhether you are writing a proposal, answering a client's email, designing artwork, managing suppliers or welcoming guests at an event, your work influences how clients experience our brand.\nThe story of BLKSM continues to be written through the actions of every member of the team.",
        },
        {
          heading: "Activity",
          body: "In your learner journal, answer the following:\n- Why do you think clients choose professional event management companies instead of organising events themselves?\n- What part of the BLKSM story inspires you the most?\n- How do you hope your role will contribute to that story?",
        },
      ],
    },
  },
  {
    title: "Vision, Mission & Values",
    content: {
      format: "structured-v1",
      lessonCode: "FND-101-M01-L03",
      competenciesDeveloped: ["Organisational Awareness", "Professional Behaviour", "Brand Representation", "Decision Making"],
      introduction:
        "Every successful organisation is guided by a clear purpose.\nIts vision defines where it wants to go.\nIts mission explains why it exists.\nIts values determine how it behaves every day.\nThese are not statements that belong on a wall or inside a brochure. They are practical tools that guide decisions, influence behaviour and shape the culture of an organisation.\nUnderstanding BLKSM's Vision, Mission and Values will help you make decisions that are consistent with the standards expected throughout the company.",
      learningOutcomes: [
        "Explain the purpose of a vision statement.",
        "Explain the purpose of a mission statement.",
        "Describe the BLKSM Core Values.",
        "Apply the company's values when making workplace decisions.",
        "Recognise how values influence organisational culture.",
      ],
      leadershipThought: "Culture is not created by policies. It is created by the decisions people make every day.",
      sections: [
        {
          heading: "1. Why Vision, Mission & Values Matter",
          body: "Imagine building a stadium without architectural drawings.\nImagine organising a festival without a programme.\nImagine planning an event without knowing the client's objectives.\nThe result would be confusion.\nThe same principle applies to organisations.\nWithout a clear direction, every employee makes different decisions.\nDifferent decisions create inconsistent experiences.\nInconsistent experiences damage trust.\nFor this reason, every successful organisation defines three things:\n- Where we are going.\n- Why we exist.\n- How we behave while getting there.\nThese are expressed through the Vision, Mission and Core Values.",
        },
        {
          heading: "2. Our Vision",
          body: 'Vision Statement\nTo become South Africa\'s most trusted event management and live experience company, recognised for operational excellence, innovation and unforgettable experiences.\n\nWhat Does This Mean?\nOur vision is not about becoming the biggest company.\nIt is about becoming the most trusted.\nTrust is earned through consistency.\nClients trust companies that:\n- Deliver on their promises.\n- Communicate honestly.\n- Solve problems professionally.\n- Protect budgets.\n- Deliver quality every time.\nEvery employee contributes to building that trust.\n\nIn Practice\nA client phones two weeks before an event with concerns about supplier delays.\nInstead of avoiding the conversation, the Account Manager immediately arranges a meeting, presents alternative solutions and provides a revised timeline.\nThe client leaves the meeting feeling informed and confident.\nThat is how trust is built.',
        },
        {
          heading: "3. Our Mission",
          body: "Mission Statement\nTo design, manage and deliver exceptional live experiences through creativity, strategic thinking, operational excellence and outstanding client service.\n\nUnderstanding Our Mission — every word matters.\n\nDesign — We don't simply organise events. We create experiences. We carefully plan every detail to achieve a specific outcome.\n\nManage — Great ideas require professional management. Budgets. Suppliers. Timelines. Teams. Communication. Risk. Everything must be coordinated effectively.\n\nDeliver — Ideas only become successful when they are executed professionally. Execution is where reputation is built.\n\nExceptional — Good is never enough. Our objective is to exceed expectations.\n\nLive Experiences — People may forget presentations. They may forget menus. They may even forget entertainment. They rarely forget how an event made them feel. That feeling is what we design.",
        },
        {
          heading: "4. Our Core Values",
          body: "These values guide every decision we make.\n\nExcellence — We strive to deliver work of the highest standard. Excellence is found in the details. Small improvements create exceptional experiences. Example: double-checking supplier information before sending it to a client, reviewing presentations before meetings, testing equipment before guests arrive.\n\nAccountability — We take ownership of our work. When mistakes happen, we address them honestly, resolve them quickly and learn from them. We do not blame others.\n\nProfessionalism — Demonstrated through respect, preparation, reliability, integrity, appropriate communication, confidentiality. Professionalism should be visible in every interaction.\n\nCreativity — Events should inspire. Creativity helps us solve problems, improve experiences and create memorable moments, supported by sound planning and practical execution.\n\nCollaboration — No successful event is delivered by one individual. Strong teams communicate openly, support one another and share responsibility for outcomes.\n\nInnovation — We continuously look for better ways to work: new technologies, better workflows, improved guest experiences, more efficient systems, creative event concepts.\n\nIntegrity — Integrity means doing the right thing, even when no one is watching. Clients trust us with their brands, budgets and reputations. That trust must never be compromised.",
        },
        {
          heading: "5. Living Our Values",
          body: 'Values only matter when they influence behaviour.\nAsk yourself, when making a difficult decision:\n- Does this demonstrate excellence?\n- Am I taking ownership?\n- Am I behaving professionally?\n- Am I collaborating effectively?\n- Does this strengthen client trust?\nIf the answer is yes, you are probably making the right decision.\n\nCase Study — Two Project Coordinators\nBoth coordinators discover that supplier quotations contain pricing errors.\nCoordinator A ignores the issue because correcting it will delay the proposal.\nCoordinator B immediately reports the issue, contacts the supplier and updates the quotation before sending it to the client.\nWhich employee demonstrated the BLKSM values? Coordinator B — because accountability, professionalism and integrity are more important than convenience.\n\nThe BLKSM Way\nOur values are not posters displayed on office walls.\nThey are practical standards that influence every email, meeting, proposal, budget, supplier discussion and client interaction.',
        },
        {
          heading: "Lesson Summary",
          body: "After completing this lesson you should understand:\n- Why organisations define a Vision and Mission.\n- The direction BLKSM is working towards.\n- The purpose of the organisation.\n- The seven Core Values that guide decision-making.\n- How these values influence your behaviour every day.",
        },
        {
          heading: "Written Reflection (not auto-graded)",
          body: "Question: Which BLKSM Core Value do you believe will be most important in your role, and why? (Short written response — minimum 200 words.)\n\nPractical Exercise: Complete the \"Living Our Values\" Worksheet. For each BLKSM Core Value: write the value in your own words, give one example of how you can demonstrate it in your role, describe one behaviour that would violate that value, and identify one personal improvement you will make over the next three months.\n\nManager Conversation: Discuss your completed worksheet with your manager during your probation review.",
        },
      ],
    },
    knowledgeCheck: {
      title: "Knowledge Check 3",
      passMarkPercent: 70,
      maxAttempts: 3,
      questions: [
        {
          questionType: "MCQ_SINGLE",
          promptText: "What is the primary purpose of a vision statement?",
          options: [
            { optionText: "To describe daily procedures", isCorrect: false },
            { optionText: "To explain payroll processes", isCorrect: false },
            { optionText: "To define the future direction of the organisation", isCorrect: true },
            { optionText: "To describe employee benefits", isCorrect: false },
          ],
        },
        {
          questionType: "TRUE_FALSE",
          promptText: "Values only apply to managers.",
          options: [
            { optionText: "True", isCorrect: false },
            { optionText: "False", isCorrect: true },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "Which of the following best demonstrates accountability?",
          options: [
            { optionText: "Ignoring a mistake and hoping nobody notices", isCorrect: false },
            { optionText: "Accepting responsibility, correcting the issue and learning from it", isCorrect: true },
            { optionText: "Blaming another department", isCorrect: false },
            { optionText: "Waiting for someone else to solve the problem", isCorrect: false },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "According to BLKSM's mission, exceptional events require:",
          options: [
            { optionText: "Expensive venues only", isCorrect: false },
            { optionText: "Creativity, strategic thinking, operational excellence and outstanding client service", isCorrect: true },
            { optionText: "Famous entertainers", isCorrect: false },
            { optionText: "Large budgets", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    title: "The BLKSM Standard",
    content: {
      format: "structured-v1",
      lessonCode: "FND-101-M01-L04",
      competenciesDeveloped: [
        "Professionalism",
        "Accountability",
        "Client Excellence",
        "Communication",
        "Teamwork",
        "Critical Thinking",
        "Personal Leadership",
      ],
      introduction:
        "Every successful organisation has a standard.\nAt BLKSM, that standard is not measured only by the quality of the event.\nIt is measured by how we think, how we behave, how we solve problems and how we represent our clients.\nThe BLKSM Standard is the benchmark for every employee regardless of position or seniority.\nYour technical skills may help you get the job.\nThe BLKSM Standard determines how successful you become within the organisation.",
      learningOutcomes: [
        "Explain the purpose of the BLKSM Standard.",
        "Identify the characteristics of a BLKSM Professional.",
        "Apply the BLKSM Standard to workplace situations.",
        "Recognise behaviours that strengthen or damage the company's reputation.",
        "Commit to personal excellence in your role.",
      ],
      leadershipThought:
        "People may forget what happened during an event, but they never forget how the experience made them feel. Every action you take contributes to that experience.",
      sections: [
        {
          heading: "1. What is the BLKSM Standard?",
          body: 'The BLKSM Standard is the collection of behaviours, attitudes and professional expectations that every employee is expected to demonstrate.\nIt is not a policy. It is not a checklist.\nIt is a commitment to consistently delivering work that reflects the values and reputation of BLKSM.\nWhen someone says, "That was handled the BLKSM way," they should immediately associate it with professionalism, quality and trust.',
        },
        {
          heading: "2. The Seven Standards of Every BLKSM Professional",
          body: 'Standard 1 — We Take Ownership\nOwnership means accepting responsibility for outcomes: following through on commitments, solving problems instead of avoiding them, admitting mistakes quickly, communicating proactively, looking for solutions before assigning blame.\n\nStandard 2 — We Communicate Clearly\nEvery communication should be accurate, professional, timely, respectful, clear and solution-focused.\n\nStandard 3 — We Sweat the Small Stuff\nDetails matter — guests, clients and suppliers all notice them. One overlooked detail can reduce confidence in an otherwise excellent event.\n\nStandard 4 — We Respect Time\nRespecting time means arriving prepared, starting meetings on time, delivering work before deadlines, responding promptly and planning ahead.\n\nStandard 5 — We Put the Client First\nGreat service is proactive — the best client experiences are built by solving problems before clients even know they exist.\n\nStandard 6 — We Win Together\nNo event succeeds because of one person. Great team members share information, offer assistance, respect expertise, celebrate team success and support colleagues under pressure.\n\nStandard 7 — We Never Stop Improving\nEvery event, every challenge and every mistake is an opportunity to learn. At BLKSM we ask: "What can we do better next time?"',
        },
        {
          heading: "3. The Cost of Ignoring the Standard",
          body: "Failure to uphold the BLKSM Standard affects more than one person. It can result in lost client confidence, budget overruns, supplier frustration, poor team morale, missed deadlines and damage to the company's reputation. One careless action can affect months of planning.",
        },
        {
          heading: "4. What Excellence Looks Like",
          body: "Excellence is rarely dramatic. It is usually found in consistent habits: preparing before meetings, following up when promised, double-checking proposals, greeting guests professionally, keeping workspaces organised, wearing appropriate attire, being respectful under pressure, remaining calm during challenges.",
        },
        {
          heading: "Case Study: The Forgotten Name Badge",
          body: "A corporate conference is scheduled to begin at 08:30. At 07:45, a VIP guest arrives and their personalised name badge has not been printed.\nOption A: Tell the guest to wait while someone searches for the problem.\nOption B: Welcome the guest personally, issue a temporary badge immediately, apologise professionally, print the replacement within minutes and escort the guest to the hospitality area.\nBoth options solve the problem — only one demonstrates the BLKSM Standard. The difference is professionalism, not technical competence.",
        },
        {
          heading: "The BLKSM Way",
          body: 'We measure success by asking three questions after every interaction: Did we deliver what we promised? Did we make the experience easier for the client? Would we be proud if this became the example used to train future employees?\n\nCommon mistakes to avoid: waiting for instructions instead of taking initiative, assuming someone else will solve the problem, sending incomplete communication, missing deadlines without informing anyone, ignoring small details, becoming defensive when receiving feedback.\n\nProfessional tip: before leaving work each day, ask yourself what you improved, whether you honoured your commitments, and what you will improve tomorrow.',
        },
        {
          heading: "Lesson Summary",
          body: "The BLKSM Standard is not a document. It is the way we work. Every employee is responsible for protecting the reputation that BLKSM has built. Excellence is achieved through consistent professional behaviour, every day, on every project.",
        },
        {
          heading: "Written Reflection & Practical Assessment (not auto-graded)",
          body: "Question: Why is continuous improvement essential in professional event management? (Short written response — minimum 250 words.)\n\nPractical Assessment — Scenario Exercise: You are the Account Executive responsible for a client event. At 18:00, the day before the event, you discover that a key supplier has delivered the wrong branded materials. Prepare a response explaining your immediate actions, who you would inform, how you would communicate with the client, how you would minimise impact, and which BLKSM Standards guided your decisions. Submission length: 750–1,000 words.\n\nManager Discussion: Meet with your manager to discuss which BLKSM Standard comes most naturally to you, which you need to improve, and record one measurable development goal.",
        },
      ],
    },
    knowledgeCheck: {
      title: "Knowledge Check 4",
      passMarkPercent: 70,
      maxAttempts: 3,
      questions: [
        {
          questionType: "MCQ_SINGLE",
          promptText: "The BLKSM Standard is best described as:",
          options: [
            { optionText: "A list of company policies", isCorrect: false },
            { optionText: "A collection of behaviours and professional expectations that define how we work", isCorrect: true },
            { optionText: "A marketing campaign", isCorrect: false },
            { optionText: "A disciplinary process", isCorrect: false },
          ],
        },
        {
          questionType: "TRUE_FALSE",
          promptText: "Ownership means accepting responsibility only for your own tasks.",
          options: [
            { optionText: "True", isCorrect: false },
            { optionText: "False", isCorrect: true },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "Which of the following best demonstrates excellent communication?",
          options: [
            { optionText: "Responding only when reminded", isCorrect: false },
            { optionText: "Providing clear, timely and complete information with the required next steps", isCorrect: true },
            { optionText: "Sending short messages without context", isCorrect: false },
            { optionText: "Waiting until the last minute to update the client", isCorrect: false },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "Which BLKSM Standard is demonstrated by double-checking a proposal before sending it to a client?",
          options: [
            { optionText: "Respect Time", isCorrect: false },
            { optionText: 'Attention to Detail ("We Sweat the Small Stuff")', isCorrect: true },
            { optionText: "Win Together", isCorrect: false },
            { optionText: "Continuous Improvement", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    title: "Living the Brand: Becoming a BLKSM Ambassador",
    content: {
      format: "structured-v1",
      lessonCode: "FND-101-M01-L05",
      competenciesDeveloped: [
        "Brand Representation",
        "Professional Communication",
        "Client Service Excellence",
        "Emotional Intelligence",
        "Professional Conduct",
        "Personal Leadership",
      ],
      introduction:
        'A brand is far more than a logo, a colour palette or a website.\nA brand is the experience people have every time they interact with an organisation.\nEvery employee shapes that experience.\nClients rarely distinguish between "the company" and "the employee." To them, you are BLKSM.\nThis lesson explores what it means to become a true ambassador for the organisation.',
      learningOutcomes: [
        "Explain what a brand truly represents.",
        "Describe your role as a BLKSM Brand Ambassador.",
        "Demonstrate behaviours that strengthen client confidence.",
        "Identify behaviours that damage the company's reputation.",
        "Understand how every interaction influences the client experience.",
      ],
      leadershipThought: "Your business card doesn't represent BLKSM. You do.",
      sections: [
        {
          heading: "1. What Is a Brand?",
          body: "Many people believe a brand is simply a logo. It isn't.\nA brand is the feeling people experience after interacting with an organisation.\nWhen someone hears the name BLKSM, we want them to think: professional, reliable, creative, organised, innovative, trustworthy, calm under pressure.\nThese impressions are created through thousands of interactions between our employees and the people we serve.",
        },
        {
          heading: "2. Every Employee Is a Brand Ambassador",
          body: "Regardless of your position, you represent BLKSM. Clients judge everyone they encounter — the receptionist, the event crew, the registration staff, the designer, the photographer, the technician, the marketing team. Every employee carries the responsibility of protecting the BLKSM reputation.",
        },
        {
          heading: "3. The Moments That Matter",
          body: "Clients remember moments: how quickly we respond to enquiries, how we answer the telephone, how we dress at events, whether we arrive prepared, how we handle unexpected problems. People often forget the technical details of an event — they rarely forget how they were treated.",
        },
        {
          heading: "4. Professional Presence",
          body: "Professional presence combines your appearance, attitude and behaviour.\n\nAppearance — present yourself in a manner that reflects the BLKSM brand, maintain good personal grooming and wear the required attire for your role.\n\nCommunication — speak clearly, listen actively, remain respectful, avoid gossip, never argue with clients.\n\nAttitude — remain positive, stay calm under pressure, support your colleagues, look for solutions rather than problems.",
        },
        {
          heading: "5. Building Trust",
          body: "Trust is earned through consistency. Clients trust people who keep promises, meet deadlines, communicate honestly, admit mistakes, solve problems and remain calm under pressure. Trust cannot be demanded — it must be earned through every interaction.",
        },
        {
          heading: "6. Social Media Responsibility",
          body: "Online behaviour can influence how people perceive BLKSM. Before posting about work or company events: ensure you have permission where required, respect client confidentiality, avoid sharing sensitive information, and remember that online content can be permanent.",
        },
        {
          heading: "7. Representing BLKSM During Events",
          body: "On event day you become the face of the organisation. Guests may never meet senior management — they will meet you. Your role is to make every guest feel welcome, informed, safe, respected and valued. Smile, maintain eye contact, offer assistance before being asked, keep promises, follow up, thank people.",
        },
        {
          heading: "8. Protecting the Brand During Difficult Situations",
          body: "Challenges are inevitable — how we respond defines our reputation. When problems arise: remain calm, gather the facts, communicate honestly, offer solutions, keep stakeholders informed, and never blame others in front of clients or guests.",
        },
        {
          heading: "Case Study: The Guest Who Could Not Find a Seat",
          body: 'During a gala dinner, a guest discovers their assigned seat has been taken.\nResponse A: "That\'s not my department. Please speak to someone else."\nResponse B: "I\'m sorry you\'ve experienced this. Let me help you. Please allow me a moment while I find a solution."\nThe second response demonstrates ownership, professionalism and client care — that is the BLKSM experience.',
        },
        {
          heading: "Lesson Summary",
          body: "Living the BLKSM brand is about more than wearing a company shirt or using the correct logo. It means demonstrating professionalism in every interaction and consistently delivering experiences that reflect our values and standards. Every employee is an ambassador for BLKSM.",
        },
        {
          heading: "Written Reflection & Practical Assessment (not auto-graded)",
          body: "Question: In your own words, explain why every employee is considered a BLKSM Brand Ambassador. Minimum response: 250 words.\n\nPractical Workplace Assessment — The BLKSM Ambassador Challenge: over the next five working days, identify three opportunities to positively influence the experience of a client, colleague, supplier or guest, and record the situation, action taken, value demonstrated, outcome, and what you learned. Submit through the LMS. Assessment weight: 20%.\n\nModule Reflection: before completing Module 1, record a reflection (500–750 words) on what being a BLKSM Professional means to you now, and how your understanding has changed since starting this module. This becomes the first entry in your Professional Development Portfolio.",
        },
      ],
    },
    knowledgeCheck: {
      title: "Knowledge Check 5",
      passMarkPercent: 70,
      maxAttempts: 3,
      questions: [
        {
          questionType: "MCQ_SINGLE",
          promptText: "A brand is best described as:",
          options: [
            { optionText: "A logo and colour palette", isCorrect: false },
            { optionText: "A marketing campaign", isCorrect: false },
            { optionText: "The experience and perception people have after interacting with an organisation", isCorrect: true },
            { optionText: "A company slogan", isCorrect: false },
          ],
        },
        {
          questionType: "TRUE_FALSE",
          promptText: "Only client-facing employees represent the BLKSM brand.",
          options: [
            { optionText: "True", isCorrect: false },
            { optionText: "False", isCorrect: true },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "Which behaviour best demonstrates professional brand representation?",
          options: [
            { optionText: "Ignoring a guest because they are not your responsibility", isCorrect: false },
            { optionText: "Taking ownership of a guest's concern and helping them find a solution", isCorrect: true },
            { optionText: "Arguing with a supplier in front of a client", isCorrect: false },
            { optionText: "Posting confidential event information on social media", isCorrect: false },
          ],
        },
        {
          questionType: "MCQ_SINGLE",
          promptText: "When a problem occurs during an event, your first priority should be to:",
          options: [
            { optionText: "Find someone to blame", isCorrect: false },
            { optionText: "Ignore the issue until after the event", isCorrect: false },
            { optionText: "Stay calm, gather the facts, communicate honestly and work toward a solution", isCorrect: true },
            { optionText: "Wait for the client to complain", isCorrect: false },
          ],
        },
      ],
    },
  },
];

async function main() {
  const academy = await prisma.academy.findUnique({ where: { slug: "foundation-academy" } });
  if (!academy) throw new Error('Academy "foundation-academy" not found — has it been created yet?');

  const course = await prisma.course.findFirst({
    where: { academyId: academy.id, slug: "course-1-blksm-identity" },
  });
  if (!course) throw new Error('Course "course-1-blksm-identity" not found under Foundation Academy.');

  const courseModule = await prisma.courseModule.findFirst({
    where: { courseId: course.id, title: "Module 1: Welcome to BLKSM" },
  });
  if (!courseModule) throw new Error('Module "Module 1: Welcome to BLKSM" not found under Course 1.');

  for (const item of LESSONS) {
    const lesson = await prisma.lesson.findFirst({
      where: { courseModuleId: courseModule.id, title: item.title },
    });
    if (!lesson) {
      console.log(`Lesson "${item.title}" not found — skipping.`);
      continue;
    }

    const existingContent = lesson.content as { format?: string } | null;
    if (existingContent?.format === "structured-v1") {
      console.log(`"${item.title}": content already migrated, leaving as-is.`);
    } else {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { content: item.content as any },
      });
      console.log(`"${item.title}": content migrated to structured-v1.`);
    }

    if (item.knowledgeCheck) {
      const existingAssessment = await prisma.assessment.findFirst({ where: { lessonId: lesson.id } });
      if (existingAssessment) {
        console.log(`"${item.title}": Knowledge Check already exists, skipping.`);
        continue;
      }

      const assessment = await prisma.assessment.create({
        data: {
          lessonId: lesson.id,
          title: item.knowledgeCheck.title,
          passMarkPercent: item.knowledgeCheck.passMarkPercent,
          maxAttempts: item.knowledgeCheck.maxAttempts,
          assessmentKind: "ASSESSMENT",
          status: "PUBLISHED",
        },
      });

      for (const [i, q] of item.knowledgeCheck.questions.entries()) {
        const question = await prisma.question.create({
          data: {
            questionType: q.questionType as QuestionType,
            promptText: { text: q.promptText },
            points: 1,
            options: {
              create: q.options.map((o, oi) => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                order: oi,
              })),
            },
          },
        });
        await prisma.assessmentQuestion.create({
          data: { assessmentId: assessment.id, questionId: question.id, order: i },
        });
      }
      console.log(`"${item.title}": created Knowledge Check with ${item.knowledgeCheck.questions.length} questions.`);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

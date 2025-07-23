"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LearnProCaseStudy() {
  const metrics = [
    {
      value: "320%",
      label: "Student Growth",
      subtext: "Increase in course enrollments",
    },
    {
      value: "28 days",
      label: "Implementation",
      subtext: "Full optimization completed",
    },
    {
      value: "89%",
      label: "AI Visibility",
      subtext: "Educational content discovery rate",
    },
    {
      value: "215%",
      label: "Conversion Rate",
      subtext: "From inquiry to enrollment",
    },
  ];

  const challenges = [
    {
      icon: "🔍",
      title: "Course Discovery Gap",
      description:
        "Students asking AI assistants about programming courses, career changes, or specific skills weren&apos;t finding LearnPro&apos;s relevant offerings.",
      beforeState: "2% of inquiries from AI sources",
      afterState: "38% of inquiries from AI sources",
    },
    {
      icon: "📚",
      title: "Complex Curriculum",
      description:
        "Technical course descriptions and learning paths were too complex for AI assistants to recommend to students at appropriate skill levels.",
      beforeState: "Low course-query matching",
      afterState: "92% accurate skill-level matching",
    },
    {
      icon: "🎯",
      title: "Career Outcome Visibility",
      description:
        "Success stories and career outcomes weren&apos;t being recognized when students asked AI for advice about career transitions and skill development.",
      beforeState: "Outcomes rarely mentioned",
      afterState: "Featured in 85% of career advice",
    },
  ];

  const solutions = [
    {
      title: "Skill-Based Content Architecture",
      description:
        "Restructured course content to match how students actually search for learning opportunities - by skills, career goals, and experience levels.",
      implementation: [
        "Created skill-based learning pathways",
        "Optimized course descriptions for career outcomes",
        "Mapped prerequisites and progression routes",
        "Added industry-relevant project examples",
      ],
      results: [
        "400% increase in skill-based course recommendations",
        "Higher student satisfaction with course relevance",
        "Better completion rates due to appropriate matching",
      ],
    },
    {
      title: "Career Transition Optimization",
      description:
        "Developed content specifically addressing career change questions that students commonly ask AI assistants.",
      implementation: [
        "Created career transition guides",
        "Optimized success story formatting",
        "Added salary and job market information",
        "Integrated employer partnership details",
      ],
      results: [
        "350% increase in career-change recommendations",
        "85% of students citing AI referral for career goals",
        "Higher-quality leads with clear objectives",
      ],
    },
    {
      title: "Learning Path Intelligence",
      description:
        "Made complex learning progressions understandable to AI assistants, helping them recommend appropriate next steps for students.",
      implementation: [
        "Structured prerequisite information",
        "Created beginner-to-expert pathways",
        "Added time commitment and difficulty levels",
        "Optimized certification and outcome descriptions",
      ],
      results: [
        "280% improvement in pathway recommendations",
        "Reduced student dropout by 45%",
        "Higher course completion rates",
      ],
    },
  ];

  const studentJourney = [
    {
      stage: "Discovery",
      query: "&ldquo;How do I learn web development with no experience?&rdquo;",
      aiResponse:
        "LearnPro offers a comprehensive beginner-friendly web development bootcamp...",
      result: "250% increase in beginner course enrollments",
    },
    {
      stage: "Evaluation",
      query:
        "&ldquo;What are the job prospects after completing a coding bootcamp?&rdquo;",
      aiResponse:
        "LearnPro graduates have a 94% job placement rate with average salary increases of 85%...",
      result: "180% higher conversion from inquiry to enrollment",
    },
    {
      stage: "Decision",
      query:
        "&ldquo;Which coding bootcamp has the best student support?&rdquo;",
      aiResponse:
        "LearnPro provides 1-on-1 mentorship, career coaching, and lifetime alumni support...",
      result: "320% increase in positive sentiment mentions",
    },
  ];

  const outcomes = [
    {
      metric: "Student Enrollments",
      before: "145/month",
      after: "608/month",
      change: "+320%",
      color: "blue",
    },
    {
      metric: "Cost Per Acquisition",
      before: "$89",
      after: "$31",
      change: "-65%",
      color: "green",
    },
    {
      metric: "Student Quality Score",
      before: "6.2/10",
      after: "8.9/10",
      change: "+44%",
      color: "purple",
    },
    {
      metric: "Course Completion Rate",
      before: "67%",
      after: "84%",
      change: "+25%",
      color: "indigo",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              href="/case-studies"
              className="inline-flex items-center text-indigo-200 hover:text-white mb-8 transition-colors"
            >
              ← Back to Case Studies
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">🎓</span>
                  <div>
                    <div className="text-indigo-200 text-lg font-medium">
                      Education
                    </div>
                    <div className="text-2xl font-bold">LearnPro</div>
                  </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  How LearnPro Grew Student Acquisition by 320% Through AI
                  Discovery
                </h1>

                <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                  See how this online coding bootcamp became the top AI
                  recommendation for career changers and new developers seeking
                  technology education.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                    Education Strategy Guide
                  </Button> */}
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-gray-900 hover:bg-white hover:text-indigo-600"
                    >
                      Schedule Education Consultation
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-6 text-center"
                  >
                    <div className="text-3xl font-bold mb-2 text-gray-900">
                      {metric.value}
                    </div>
                    <div className="text-gray-700 text-sm font-medium mb-2">
                      {metric.label}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {metric.subtext}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About LearnPro */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  About LearnPro
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  LearnPro is an online coding bootcamp founded in 2020 that
                  specializes in full-stack web development, data science, and
                  cybersecurity programs. They focus on career changers and
                  professionals looking to break into tech, with flexible
                  part-time and full-time options.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  With a 94% job placement rate and average salary increases of
                  85% for graduates, LearnPro has built a strong reputation in
                  the bootcamp space. Their hands-on curriculum, 1-on-1
                  mentorship, and career support services set them apart from
                  larger, more impersonal programs.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  The challenge: as more prospective students turned to AI
                  assistants for advice about career changes and learning
                  programming, LearnPro&apos;s offerings weren&apos;t being
                  discovered or recommended.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Education Stats
              </h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-indigo-600">
                    2,400+
                  </div>
                  <div className="text-gray-600">Graduates</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-indigo-600">94%</div>
                  <div className="text-gray-600">Job Placement Rate</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-indigo-600">85%</div>
                  <div className="text-gray-600">Avg Salary Increase</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-600">
                    4 years
                  </div>
                  <div className="text-gray-600">Training Experience</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Educational Discovery Challenges
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Online education providers face unique challenges in AI discovery,
              from complex technical content to helping students find the right
              learning path.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8"
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">{challenge.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {challenge.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {challenge.description}
                </p>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-red-600 text-sm font-medium">
                      Before
                    </div>
                    <div className="text-red-800 font-bold text-sm">
                      {challenge.beforeState}
                    </div>
                  </div>
                  <div className="text-gray-400 text-center">↓</div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-green-600 text-sm font-medium">
                      After
                    </div>
                    <div className="text-green-800 font-bold text-sm">
                      {challenge.afterState}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Student-Centric AI Strategy
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              LearnPro&apos;s approach focused on understanding how students
              actually search for educational opportunities and optimizing
              content to match those patterns.
            </p>
          </motion.div>

          <div className="space-y-16">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {solution.title}
                    </h3>
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                      {solution.description}
                    </p>

                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Implementation:
                      </h4>
                      <ul className="space-y-2">
                        {solution.implementation.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-start gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 text-sm">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Results:
                      </h4>
                      <ul className="space-y-2">
                        {solution.results.map((result, resultIndex) => (
                          <li
                            key={resultIndex}
                            className="flex items-start gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 text-sm font-medium">
                              {result}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={index % 2 === 1 ? "lg:col-start-1" : ""}>
                  <div className="text-center">
                    <div className="text-8xl mb-6">
                      {index === 0 ? "🎯" : index === 1 ? "🚀" : "🛣️"}
                    </div>
                    <div className="text-6xl font-bold text-indigo-600">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Journey */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              AI-Powered Student Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how AI assistants now guide prospective students through their
              decision-making process, with LearnPro positioned at every key
              touchpoint.
            </p>
          </motion.div>

          <div className="space-y-8">
            {studentJourney.map((stage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8"
              >
                <div className="grid lg:grid-cols-4 gap-8 items-center">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full font-bold text-lg mb-3">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {stage.stage}
                    </h3>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-blue-600 font-medium text-sm mb-2">
                          Student Query
                        </div>
                        <div
                          className="text-blue-800 italic"
                          dangerouslySetInnerHTML={{ __html: stage.query }}
                        ></div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-600 font-medium text-sm mb-2">
                          AI Response
                        </div>
                        <div className="text-green-800">{stage.aiResponse}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-4">
                      <div className="text-indigo-600 font-medium text-sm mb-2">
                        Impact
                      </div>
                      <div className="text-indigo-800 font-bold">
                        {stage.result}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Transformational Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Within 28 days, LearnPro saw dramatic improvements across all key
              enrollment and student success metrics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {outcomes.map((outcome, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center shadow-sm"
              >
                <h3 className="font-bold text-gray-900 mb-4 text-sm">
                  {outcome.metric}
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 font-medium">
                      Before
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {outcome.before}
                    </div>
                  </div>
                  <div className="text-xl text-gray-400">↓</div>
                  <div className={`bg-${outcome.color}-50 rounded-lg p-3`}>
                    <div
                      className={`text-xs text-${outcome.color}-600 font-medium`}
                    >
                      After
                    </div>
                    <div
                      className={`text-lg font-bold text-${outcome.color}-800`}
                    >
                      {outcome.after}
                    </div>
                  </div>
                </div>

                <div className={`text-sm font-bold text-${outcome.color}-600`}>
                  {outcome.change}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <blockquote className="text-2xl lg:text-3xl font-light mb-8 leading-relaxed">
              &ldquo;The change has been remarkable. Students now come to us
              already informed and excited about specific programs. They&apos;ve
              done their research through AI assistants and understand exactly
              how our bootcamp can help them achieve their career goals.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👩‍🏫</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">Rebecca Martinez</div>
                <div className="text-indigo-200">
                  Head of Student Success, LearnPro
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              Transform Your Educational Impact
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join LearnPro and other educational providers seeing remarkable
              student growth through AI-powered discovery. Help more students
              find the education they need to succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 px-8 py-3"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-gray-900 hover:bg-white hover:text-black px-8 py-3"
                >
                  Education Strategy Call
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

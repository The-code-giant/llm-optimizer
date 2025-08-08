 
import { Button } from "@/components/ui/button";
import ScrollToFormButton from "@/components/ScrollToFormButton";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  PlayIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Link from "next/link";
import CalendlyWidget from '@/components/calendly-widget';
import AnimatedDiv from "@/components/ui/animated-div";
export default function Demo() {
  // const [selectedTime, setSelectedTime] = useState('');
  // const [formData, setFormData] = useState({
  //   firstName: '',
  //   lastName: '',
  //   email: '',
  //   company: '',
  //   website: '',
  //   role: '',
  //   teamSize: '',
  //   goals: ''
  // });

  // const timeSlots = [
  //   '9:00 AM EST',
  //   '10:00 AM EST',
  //   '11:00 AM EST',
  //   '1:00 PM EST',
  //   '2:00 PM EST',
  //   '3:00 PM EST',
  //   '4:00 PM EST'
  // ];

  const demoFeatures = [
    {
      icon: ChartBarIcon,
      title: "Live LLM Readiness Analysis",
      description: "See your website's AI optimization score calculated in real-time"
    },
    {
      icon: CogIcon,
      title: "Personalized Recommendations",
      description: "Get custom optimization suggestions based on your content"
    },
    {
      icon: PlayIcon,
      title: "Platform Walkthrough",
      description: "Explore all features with guided tour of the dashboard"
    },
    {
      icon: UserGroupIcon,
      title: "Strategy Session",
      description: "Discuss your specific goals with our optimization experts"
    }
  ];

  const benefits = [
    "Understand your current LLM citation potential",
    "See competitor analysis and benchmarking",
    "Get a custom optimization roadmap",
    "Learn about ROI and expected results",
    "Explore pricing options for your needs",
    "Ask questions about implementation"
  ];

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  //   setFormData({
  //     ...formData,
  //     [e.target.name]: e.target.value
  //   });
  // };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Handle form submission
  //   console.log('Demo booking:', { ...formData, selectedTime });
  // };


  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedDiv
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
                See Clever Search in action
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Book a personalized demo to discover how AI optimization can
                transform your content&apos;s visibility in ChatGPT, Claude, and
                Gemini responses.
              </p>

              <div className="space-y-4 mb-8">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center text-gray-400">
                <ClockIcon className="w-5 h-5 mr-2" />
                <span>30-minute personalized session</span>
              </div>
            </AnimatedDiv>

            <AnimatedDiv
        
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gray-900 rounded-2xl p-8"
            >
              <div className="text-center mb-6">
                <CalendarDaysIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Schedule Your Demo</h3>
                <p className="text-gray-400">Choose your preferred time slot</p>
              </div>

              <CalendlyWidget />

              {/* <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Work Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="company"
                    placeholder="Company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="url"
                    name="website"
                    placeholder="Website URL"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="marketing-manager">Marketing Manager</option>
                    <option value="content-manager">Content Manager</option>
                    <option value="seo-specialist">SEO Specialist</option>
                    <option value="founder-ceo">Founder/CEO</option>
                    <option value="agency-owner">Agency Owner</option>
                    <option value="other">Other</option>
                  </select>

                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Team Size</option>
                    <option value="1-5">1-5 people</option>
                    <option value="6-20">6-20 people</option>
                    <option value="21-50">21-50 people</option>
                    <option value="51-200">51-200 people</option>
                    <option value="200+">200+ people</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  name="goals"
                  placeholder="What are your main goals for LLM optimization? (Optional)"
                  value={formData.goals}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded-lg"
                  disabled={!selectedTime}
                >
                  Book Your Demo
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </form> */}
            </AnimatedDiv>
          </div>
        </div>
      </section>

      {/* What You'll See */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              What you&apos;ll see in your demo
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our product experts will walk you through the platform and show
              you exactly how LLM optimization works for your specific use case.
            </p>
          </AnimatedDiv>

          <div className="grid lg:grid-cols-2 gap-12">
            {demoFeatures.map((feature, index) => (
              <AnimatedDiv
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              What you&apos;ll learn
            </h2>
            <p className="text-lg text-gray-600">
              By the end of your demo, you&apos;ll have a clear understanding of your
              optimization potential.
            </p>
          </AnimatedDiv>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <AnimatedDiv
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-center p-6 bg-gray-50 rounded-xl"
              >
                <CheckCircleIcon className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{benefit}</span>
              </AnimatedDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              What others say about our demos
            </h2>
          </AnimatedDiv>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "The demo was incredibly insightful. Seeing our actual website analyzed in real-time made the value immediately clear.",
                author: "Sarah Chen",
                role: "Marketing Director",
                company: "TechFlow Solutions",
              },
              {
                quote:
                  "I was skeptical about AI optimization, but the demo showed concrete data and results. We signed up the same day.",
                author: "Mike Rodriguez",
                role: "Content Manager",
                company: "Growth Labs",
              },
              {
                quote:
                  "The personalized recommendations we got during the demo saved us months of trial and error. Highly recommend.",
                author: "Emily Watson",
                role: "SEO Specialist",
                company: "Digital Dynamics",
              },
            ].map((testimonial, index) => (
              <AnimatedDiv
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <p className="text-gray-600 mb-6 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.author}
                  </div>
                  <div className="text-gray-500">{testimonial.role}</div>
                  <div className="text-gray-500">{testimonial.company}</div>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Demo FAQ</h2>
          </AnimatedDiv>

          <div className="space-y-6">
            {[
              {
                question: "How long is the demo?",
                answer:
                  "Demos typically last 30 minutes, with time for questions at the end. We can extend if needed to cover all your questions.",
              },
              {
                question: "Will you analyze my actual website?",
                answer:
                  "Yes! We'll run a live analysis of your website during the demo so you can see real results and recommendations.",
              },
              {
                question: "Is there any commitment required?",
                answer:
                  "Not at all. The demo is completely free with no obligation. It's designed to help you understand if LLM optimization is right for your business.",
              },
              {
                question: "Can my team join the demo?",
                answer:
                  "Absolutely! We encourage team participation. Just let us know how many people will be joining when you book.",
              },
              {
                question: "What if I need to reschedule?",
                answer:
                  "No problem. You can reschedule or cancel anytime by clicking the link in your confirmation email.",
              },
            ].map((faq, index) => (
              <AnimatedDiv
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </AnimatedDiv>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimatedDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Ready to see the future of content optimization?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Book your personalized demo today and discover how AI optimization
              can transform your content strategy.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <ScrollToFormButton
                size="lg"
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 cursor-pointer"
                targetSelector="calendly-widget"
                offset={120}
              >
                Schedule Demo
              </ScrollToFormButton>
              <Link href="/contact" className="w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-black hover:bg-white hover:text-black rounded-full px-8 py-4 cursor-pointer"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </AnimatedDiv>
        </div>
      </section>

      <Footer />
    </div>
  );
} 
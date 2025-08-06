"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from 'next/image'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function SophiaLanding() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h1 className="text-6xl lg:text-7xl font-bold text-black mb-6" variants={fadeInUp}>
            Sophia<span className="text-blue-600">.</span>
          </motion.h1>
          <motion.h2
            className="text-4xl lg:text-5xl font-normal text-gray-500 mb-12 max-w-4xl mx-auto leading-tight"
            variants={fadeInUp}
          >
            AI that understands how each student thinks
          </motion.h2>
          <motion.div variants={fadeInUp}>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              Get Started
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="min-h-screen flex items-center px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInLeft}>
              <h3 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                Personalized understanding.
              </h3>
              <p className="text-xl text-gray-500 leading-relaxed">
                Sophia creates a personalized conceptual map of each student&apos;s knowledge and gaps.
              </p>
            </motion.div>
            <motion.div
              className="relative w-full h-80 lg:h-96"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInRight}
            >
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Personalized conceptual map showing student knowledge and learning gaps"
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Empathetic Remediation Section */}
      <section className="min-h-screen flex items-center px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="relative w-full h-80 lg:h-96 order-2 lg:order-1"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInLeft}
            >
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="AI providing gentle, targeted help tailored to individual student needs"
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
            <motion.div
              className="order-1 lg:order-2"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInRight}
            >
              <h3 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">Empathetic remediation.</h3>
              <p className="text-xl text-gray-500 leading-relaxed">
                When misconceptions arise, Sophia provides gentle, targeted help tailored to the individual&apos;s needs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="min-h-screen flex items-center px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            className="grid md:grid-cols-3 gap-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div className="relative w-full h-64 mb-6">
                <Image
                  src="/placeholder.svg?height=300&width=400"
                  alt="Feature illustration"
                  fill
                  className="rounded-lg object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <h4 className="text-2xl font-bold text-black mb-4">Personal mapping.</h4>
              <p className="text-lg text-gray-500 leading-relaxed">
                Sophia visualizes your mental model and adapts help just for you.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="relative w-full h-64 mb-6">
                <Image
                  src="/placeholder.svg?height=300&width=400"
                  alt="Feature illustration"
                  fill
                  className="rounded-lg object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <h4 className="text-2xl font-bold text-black mb-4">Not just mistakes.</h4>
              <p className="text-lg text-gray-500 leading-relaxed">
                Identifies true misconceptions—not random errors—and tailors explanations accordingly.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="relative w-full h-64 mb-6">
                <Image
                  src="/placeholder.svg?height=300&width=400"
                  alt="Feature illustration"
                  fill
                  className="rounded-lg object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <h4 className="text-2xl font-bold text-black mb-4">Meets you where you are.</h4>
              <p className="text-lg text-gray-500 leading-relaxed">
                Provides empathetic support exactly at your conceptual level.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* See Sophia in Action Section */}
      <section className="min-h-screen flex items-center px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center w-full"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h3 className="text-4xl lg:text-5xl font-bold text-black mb-6" variants={fadeInUp}>
            See Sophia in Action
          </motion.h3>
          <motion.p className="text-xl text-gray-500 leading-relaxed mb-12" variants={fadeInUp}>
            Experience learning that feels personal. Our AI gets your mind and truly helps you grow.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              Try Sophia Now
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-screen flex items-center px-6 lg:px-8 bg-gray-50">
        <motion.div
          className="max-w-4xl mx-auto text-center w-full"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h3 className="text-4xl lg:text-5xl font-bold text-black mb-6" variants={fadeInUp}>
            Ready to Transform Learning?
          </motion.h3>
          <motion.p className="text-xl text-gray-500 leading-relaxed mb-12" variants={fadeInUp}>
            Join thousands of educators and students already using Sophia to personalize their learning experience.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeInUp}>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              Start Free Trial
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-10 py-4 text-lg font-semibold transition-all duration-300"
            >
              Schedule Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        className="bg-white py-24 px-6 lg:px-8 border-t border-gray-200"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid md:grid-cols-5 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div
                    className="w-3 h-3 bg-gray-400"
                    style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                  ></div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h5 className="font-bold text-black mb-4">Sophia</h5>
              <ul className="space-y-3 text-gray-500">
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Benefits
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Get Started
                  </a>
                </li>
              </ul>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h5 className="font-bold text-black mb-4">Platform</h5>
              <ul className="space-y-3 text-gray-500">
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    For Educators
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    For Students
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h5 className="font-bold text-black mb-4">Company</h5>
              <ul className="space-y-3 text-gray-500">
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h5 className="font-bold text-black mb-4">Support</h5>
              <ul className="space-y-3 text-gray-500">
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
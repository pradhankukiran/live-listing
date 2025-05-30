"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ScanQrCode,
  Wand2,
  Layers,
  Image as ImageIcon,
  Users,
  ShieldCheck,
  Contact,
  Pyramid,
  PencilRuler,
  UserPen,
  Shirt,
  FolderInput,
} from "lucide-react";
import { SharedNavbar } from "@/components/shared/shared-navbar";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SharedNavbar />

      <main>
        <section className="pt-10 md:pt-32 pb-4 container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
                On-Model Images. Zero Photoshoots.
              </h1>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-12 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Contact className="h-10 w-10 mb-4 text-primary" />,
                  title: "AI Model Generation",
                },
                {
                  icon: <Pyramid className="h-10 w-10 mb-4 text-primary" />,
                  title: "Pose & Angle Control",
                },
                {
                  icon: <PencilRuler className="h-10 w-10 mb-4 text-primary" />,
                  title: "Customize Style & Fit",
                },
                {
                  icon: <UserPen className="h-10 w-10 mb-4 text-primary" />,
                  title: "Select Model Diversity",
                },
                {
                  icon: <Shirt className="h-10 w-10 mb-4 text-primary" />,
                  title: "Match Dress & Lighting",
                },
                {
                  icon: <FolderInput className="h-10 w-10 mb-4 text-primary" />,
                  title: "Export-Ready Format",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-center mb-2">
                    {feature.icon}
                    <h3 className="text-xl font-bold ml-4">{feature.title}</h3>
                  </div>
                  {/* <p className="text-muted-foreground">{feature.description}</p> */}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

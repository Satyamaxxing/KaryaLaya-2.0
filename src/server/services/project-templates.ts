import { ServiceType } from "./deliverable-state-machine";

export interface TemplateTask {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface TemplateDeliverable {
  title: string;
  description?: string;
  serviceType: ServiceType;
  weight: number;
  tasks: TemplateTask[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tagline: string;
  category: string;
  deliverables: TemplateDeliverable[];
}

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  "website-launch": {
    id: "website-launch",
    name: "Website Launch",
    tagline: "Custom agency design, component engineering, CMS integration, and SEO go-live.",
    description:
      "End-to-end web development sprint delivering responsive design, clean frontend code, CMS collection schema, and production deployment.",
    category: "Web Development & Design",
    deliverables: [
      {
        title: "Wireframes & Information Architecture",
        description: "User journey mapping, wireframe schematics, and desktop/mobile layout hierarchy.",
        serviceType: "DESIGN",
        weight: 1.0,
        tasks: [
          { title: "Define sitemap and URL routing structure", priority: "HIGH" },
          { title: "Draft wireframe layouts for Homepage, Services, and Contact", priority: "MEDIUM" },
          { title: "Review wireframes with client team and secure signoff", priority: "HIGH" },
        ],
      },
      {
        title: "High-Fidelity Visual Design",
        description: "Custom design token system, typography scales, responsive UI mockups, and interactive prototype.",
        serviceType: "DESIGN",
        weight: 1.5,
        tasks: [
          { title: "Create typography and color palette tokens", priority: "MEDIUM" },
          { title: "Design high-fidelity desktop and mobile viewports", priority: "HIGH" },
          { title: "Produce interactive Figma click-through prototype", priority: "MEDIUM" },
        ],
      },
      {
        title: "Frontend Development & Interactions",
        description: "Modern component architecture, pixel-perfect layout styling, and smooth micro-interactions.",
        serviceType: "WEB_DEV",
        weight: 2.0,
        tasks: [
          { title: "Build responsive layout scaffolding and nav", priority: "HIGH" },
          { title: "Implement hero vortex and micro-animations", priority: "MEDIUM" },
          { title: "Verify responsive cross-device breakpoints", priority: "HIGH" },
        ],
      },
      {
        title: "CMS & Dynamic Integrations",
        description: "CMS schema collections, contact form lead capture, and API routing.",
        serviceType: "WEB_DEV",
        weight: 1.5,
        tasks: [
          { title: "Configure CMS collections and relations", priority: "MEDIUM" },
          { title: "Hook up contact inquiry form to notification webhook", priority: "HIGH" },
          { title: "Integrate Google Tag Manager & Open Graph metadata", priority: "MEDIUM" },
        ],
      },
      {
        title: "QA, Performance Audit & Launch",
        description: "Lighthouse 95+ performance optimization, SSL verification, and custom domain deployment.",
        serviceType: "WEB_DEV",
        weight: 1.0,
        tasks: [
          { title: "Run Lighthouse audit for accessibility and speed", priority: "HIGH" },
          { title: "Configure production DNS records and SSL certs", priority: "URGENT" },
          { title: "Complete pre-flight client handoff checklist", priority: "HIGH" },
        ],
      },
    ],
  },

  "social-media-monthly": {
    id: "social-media-monthly",
    name: "Social Media Monthly",
    tagline: "Monthly content calendar, 12 viral reels, 8 graphic carousels, and engagement analytics.",
    description:
      "A complete monthly social media engine engineered to drive organic reach, community engagement, and brand authority.",
    category: "Social Media & Creative",
    deliverables: [
      {
        title: "Monthly Content Calendar & Strategic Angles",
        description: "Content pillars, hook research, scheduled posting timetable, and caption scripts.",
        serviceType: "SOCIAL",
        weight: 1.0,
        tasks: [
          { title: "Analyze previous month metrics and trending formats", priority: "MEDIUM" },
          { title: "Draft 30-day editorial calendar with key hooks", priority: "HIGH" },
          { title: "Present calendar to client for monthly approvals", priority: "HIGH" },
        ],
      },
      {
        title: "12 Short-Form Video Reels",
        description: "High-retention vertical reels edited with sound design, dynamic captions, and motion graphics.",
        serviceType: "VIDEO",
        weight: 2.0,
        tasks: [
          { title: "Write scripts and visual hooks for 12 reels", priority: "HIGH" },
          { title: "Batch footage assembly and fast-paced cut", priority: "HIGH" },
          { title: "Add animated kinetic captions and sound design", priority: "MEDIUM" },
          { title: "Color grade and export high-res vertical 9:16 files", priority: "MEDIUM" },
        ],
      },
      {
        title: "8 Educational Carousel Graphics",
        description: "Multi-slide swipeable graphics designed to maximize saves and shares.",
        serviceType: "DESIGN",
        weight: 1.5,
        tasks: [
          { title: "Write copy for 8 multi-slide carousels", priority: "MEDIUM" },
          { title: "Design slide decks using client brand guidelines", priority: "HIGH" },
          { title: "Export carousel slide decks and upload for client review", priority: "MEDIUM" },
        ],
      },
      {
        title: "Monthly Growth & Performance Report",
        description: "Comprehensive analytics report detailing reach, follower growth, engagement rates, and ROI.",
        serviceType: "SOCIAL",
        weight: 1.0,
        tasks: [
          { title: "Compile reach and engagement analytics across channels", priority: "MEDIUM" },
          { title: "Synthesize top 3 winning formats and audience takeaways", priority: "HIGH" },
          { title: "Host monthly performance review call with client", priority: "MEDIUM" },
        ],
      },
    ],
  },

  "video-production": {
    id: "video-production",
    name: "Video Production",
    tagline: "Cinematic commercial storytelling from concept, filming, rough cut, to color grading & audio master.",
    description:
      "Professional agency video workflow delivering high-production commercials, case studies, or founder brand films.",
    category: "Video & Motion",
    deliverables: [
      {
        title: "Pre-Production & Creative Treatment",
        description: "Core narrative concept, script drafting, shot list, and visual storyboard boards.",
        serviceType: "BRANDING",
        weight: 1.0,
        tasks: [
          { title: "Conduct discovery workshop on key brand narrative", priority: "HIGH" },
          { title: "Draft full commercial script and voiceover lines", priority: "HIGH" },
          { title: "Assemble visual storyboard and shot list", priority: "MEDIUM" },
          { title: "Finalize production shoot schedule & gear check", priority: "HIGH" },
        ],
      },
      {
        title: "Production Shoot & Raw Footage Ingest",
        description: "On-set production capture, lighting setups, sound recording, and secure dual-redundancy backup.",
        serviceType: "VIDEO",
        weight: 2.0,
        tasks: [
          { title: "Conduct on-location production shoot", priority: "URGENT" },
          { title: "Verify high-fidelity audio capture and lav mics", priority: "HIGH" },
          { title: "Ingest and verify dual-redundancy raw backups", priority: "HIGH" },
        ],
      },
      {
        title: "Rough Cut & Narrative Assembly",
        description: "First-pass paper edit, A-roll and B-roll sequence arrangement, and licensed music track selection.",
        serviceType: "VIDEO",
        weight: 1.5,
        tasks: [
          { title: "Select hero takes and construct narrative A-roll", priority: "HIGH" },
          { title: "Layer B-roll cutaways and pace transitions", priority: "MEDIUM" },
          { title: "Select and license royalty-free score", priority: "MEDIUM" },
          { title: "Internal creative director review of Cut V1", priority: "HIGH" },
        ],
      },
      {
        title: "Master Audio Mix, Color Grade & Delivery",
        description: "Professional DaVinci color grading, vocal dialogue cleanup, sound design effects, and master export.",
        serviceType: "VIDEO",
        weight: 1.5,
        tasks: [
          { title: "Perform dialogue cleanup and sound effects mix", priority: "HIGH" },
          { title: "Apply cinematic color grading and shot-matching", priority: "HIGH" },
          { title: "Deliver 4K Master and social crops (16:9, 9:16, 1:1)", priority: "HIGH" },
        ],
      },
    ],
  },

  "brand-identity": {
    id: "brand-identity",
    name: "Brand Identity",
    tagline: "Complete visual identity system, logos, typography, brand voice, and brand guidelines manual.",
    description:
      "Strategic agency branding sprint establishing positioning, visual language, primary & secondary logos, and comprehensive guidelines.",
    category: "Branding & Strategy",
    deliverables: [
      {
        title: "Brand Strategy & Positioning",
        description: "Brand values, customer persona profiling, tone of voice, and competitive differentiation.",
        serviceType: "BRANDING",
        weight: 1.0,
        tasks: [
          { title: "Conduct client stakeholder interview", priority: "HIGH" },
          { title: "Develop core brand archetype and value proposition", priority: "MEDIUM" },
          { title: "Synthesize tone of voice guidelines and manifesto", priority: "HIGH" },
        ],
      },
      {
        title: "Primary Logo & Mark Suite",
        description: "Primary logotype, secondary lockups, submarks, favicon icons, and responsive logo variations.",
        serviceType: "BRANDING",
        weight: 2.0,
        tasks: [
          { title: "Sketch 3 distinct logo concept directions", priority: "HIGH" },
          { title: "Vectorize chosen concept (Primary & Secondary)", priority: "HIGH" },
          { title: "Create monogram, app icon, and favicon marks", priority: "MEDIUM" },
        ],
      },
      {
        title: "Color Palette & Typography Architecture",
        description: "Accessible color harmony tokens, typography pairing, heading scales, and usage rules.",
        serviceType: "DESIGN",
        weight: 1.0,
        tasks: [
          { title: "Formulate primary, secondary, and accent color scales", priority: "HIGH" },
          { title: "Pair display and body typography with web font licenses", priority: "MEDIUM" },
          { title: "Test contrast ratios for WCAG AA compliance", priority: "HIGH" },
        ],
      },
      {
        title: "Brand Guidelines PDF & Asset Export Kit",
        description: "30+ page definitive brand guidelines booklet and production-ready vector export package.",
        serviceType: "BRANDING",
        weight: 1.5,
        tasks: [
          { title: "Design Brand Guidelines manual PDF", priority: "HIGH" },
          { title: "Package logo suite in SVG, EPS, PNG, and PDF formats", priority: "HIGH" },
          { title: "Deliver digital brand kit to client portal", priority: "HIGH" },
        ],
      },
    ],
  },
};

export function getProjectTemplate(id: string): ProjectTemplate | null {
  return PROJECT_TEMPLATES[id] || null;
}

export function listProjectTemplates(): ProjectTemplate[] {
  return Object.values(PROJECT_TEMPLATES);
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting KaryaLaya 2.0 Database Seed...");

  // Clean slate for demo agency
  await prisma.rateLimit.deleteMany({});
  await prisma.activityEvent.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.deliverable.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.clientContact.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Create Demo Organization
  const org = await prisma.organization.create({
    data: {
      name: "Apex Global Agency",
      slug: "apex-global",
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Create Users & Memberships
  const teamUsers = [
    {
      name: "Meera Sen",
      email: "meera@karyalaya.agency",
      role: "OWNER",
      jobTitle: "Founder & Head of Agency",
    },
    {
      name: "Rohan Varma",
      email: "rohan@karyalaya.agency",
      role: "MANAGER",
      jobTitle: "Delivery Director & Campaign Lead",
    },
    {
      name: "Satyam Kumar",
      email: "satyam@karyalaya.agency",
      role: "MEMBER",
      jobTitle: "Lead Web Developer",
    },
    {
      name: "Rishav Ray",
      email: "rishav@karyalaya.agency",
      role: "MEMBER",
      jobTitle: "Video Specialist",
    },
    {
      name: "Aisha Patel",
      email: "aisha@karyalaya.agency",
      role: "MEMBER",
      jobTitle: "Social Media Strategist",
    },
    {
      name: "Arjun Nair",
      email: "arjun@karyalaya.agency",
      role: "MEMBER",
      jobTitle: "Brand Architect",
    },
  ];

  for (const member of teamUsers) {
    const user = await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        passwordHash: defaultPasswordHash,
        emailVerified: new Date(),
      },
    });

    await prisma.membership.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: member.role,
        jobTitle: member.jobTitle,
      },
    });

    console.log(`  👤 Member created: ${member.name} [${member.role}]`);
  }

  // 3. Create Demo Client & Client Contact
  const client = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "BrightWave Dental",
      companyName: "BrightWave Dental Care Inc.",
      industry: "Healthcare & Aesthetics",
      portalAccessEnabled: true,
    },
  });

  const clientContact = await prisma.clientContact.create({
    data: {
      organizationId: org.id,
      clientId: client.id,
      name: "Sarah Jenkins",
      email: "sarah@brightwave.com",
      title: "VP of Marketing",
      passwordHash: defaultPasswordHash,
      canApprove: true,
    },
  });
  console.log(
    `🏢 Client created: ${client.name} with contact ${clientContact.name} (${clientContact.email})`
  );

  // 4. Create Demo Project (Led by Rohan Varma)
  const managerUser = await prisma.user.findUnique({
    where: { email: "rohan@karyalaya.agency" },
  });
  const devUser = await prisma.user.findUnique({
    where: { email: "satyam@karyalaya.agency" },
  });
  const designUser = await prisma.user.findUnique({
    where: { email: "arjun@karyalaya.agency" },
  });

  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      clientId: client.id,
      name: "BrightWave Brand & Web Launch",
      description:
        "Full digital relaunch including aesthetic brand identity, patient portal UI, custom Next.js frontend, and local search SEO.",
      status: "ACTIVE",
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: managerUser!.id,
    },
  });
  console.log(`🚀 Project created: ${project.name} (${project.id})`);

  // 5. Create Deliverables
  const d1 = await prisma.deliverable.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      title: "Brand Identity & Patient Guidelines",
      description: "Modern healthcare aesthetics, typography tokens, and primary logo variations.",
      serviceType: "BRANDING",
      ownerId: designUser!.id,
      weight: 1.0,
      status: "APPROVED",
      progressPercent: 100,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  const d2 = await prisma.deliverable.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      title: "High-Fidelity Booking Wireframes & UI",
      description: "Patient appointment scheduling flow, service catalogue, and interactive mobile prototype.",
      serviceType: "DESIGN",
      ownerId: designUser!.id,
      weight: 1.5,
      status: "SENT_TO_CLIENT",
      progressPercent: 85,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const d3 = await prisma.deliverable.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      title: "Custom Next.js Frontend & CMS Build",
      description: "Performant agency-grade Next.js web application with Lighthouse 98+ score and dark/light modes.",
      serviceType: "WEB_DEV",
      ownerId: devUser!.id,
      weight: 2.0,
      status: "IN_PROGRESS",
      progressPercent: 40,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  });

  // 6. Create Starter Tasks
  await prisma.task.createMany({
    data: [
      {
        organizationId: org.id,
        projectId: project.id,
        deliverableId: d1.id,
        title: "Export final vector logo mark and favicons",
        assigneeId: designUser!.id,
        status: "DONE",
        priority: "HIGH",
      },
      {
        organizationId: org.id,
        projectId: project.id,
        deliverableId: d2.id,
        title: "Incorporate client review comments on mobile menu",
        assigneeId: designUser!.id,
        status: "IN_REVIEW",
        priority: "MEDIUM",
      },
      {
        organizationId: org.id,
        projectId: project.id,
        deliverableId: d3.id,
        title: "Implement responsive layout and booking modal",
        assigneeId: devUser!.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
      },
      {
        organizationId: org.id,
        projectId: project.id,
        deliverableId: d3.id,
        title: "Configure SEO metadata and sitemap schema",
        assigneeId: devUser!.id,
        status: "TODO",
        priority: "MEDIUM",
      },
    ],
  });

  // 7. Initial Audit Log Event
  await prisma.activityEvent.create({
    data: {
      organizationId: org.id,
      actorId: "system",
      actorType: "SYSTEM",
      action: "DEMO_ENVIRONMENT_SEEDED",
      entityType: "ORGANIZATION",
      entityId: org.id,
      metadata: JSON.stringify({
        orgName: org.name,
        teamCount: teamUsers.length,
        projectName: project.name,
        deliverablesCount: 3,
        defaultPassword: "password123",
      }),
    },
  });

  console.log("✨ Database seed completed successfully! Default password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

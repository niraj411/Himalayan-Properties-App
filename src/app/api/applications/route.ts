import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await db.application.findMany({
      include: { property: true, unit: { select: { unitNumber: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Public endpoint for application submission
// An ADMIN session may also use it to log an applicant who came in through another
// channel (Zillow, walk-in) so the pre-lease paper trail lives in the app.
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    const {
      propertyId,
      applicationType,
      firstName,
      lastName,
      email,
      phone,
      currentAddress,
      employerName,
      employerPhone,
      jobTitle,
      monthlyIncome,
      moveInDate,
      numberOfOccupants,
      pets,
      references,
      additionalNotes,
      businessName,
      taxReturnsUrl,
      bankStatementsUrl,
      unitId,
      intendedUse,
      desiredTerm,
      guarantorName,
      status,
      adminNotes,
    } = data;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Commercial: business name is required; financial document links are optional
    // at the inquiry stage (requested before an LOI is signed).
    if (applicationType === "COMMERCIAL" && !businessName) {
      return NextResponse.json({ error: "Commercial applications require a business name" }, { status: 400 });
    }

    // Only accept a unitId that belongs to the chosen property.
    let validUnitId: string | null = null;
    if (unitId && propertyId) {
      const u = await db.unit.findFirst({ where: { id: unitId, propertyId }, select: { id: true } });
      validUnitId = u?.id ?? null;
    }

    const application = await db.application.create({
      data: {
        propertyId: propertyId || null,
        applicationType: applicationType || "RESIDENTIAL",
        firstName,
        lastName,
        email,
        phone,
        currentAddress,
        employerName,
        employerPhone,
        jobTitle,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        numberOfOccupants: numberOfOccupants ? parseInt(numberOfOccupants) : null,
        pets,
        references,
        additionalNotes,
        businessName,
        taxReturnsUrl: taxReturnsUrl || null,
        bankStatementsUrl: bankStatementsUrl || null,
        unitId: validUnitId,
        intendedUse: intendedUse || null,
        desiredTerm: desiredTerm || null,
        guarantorName: guarantorName || null,
        status: isAdmin && ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"].includes(status) ? status : "PENDING",
        adminNotes: isAdmin && adminNotes ? String(adminNotes) : null,
      },
      include: { unit: { select: { unitNumber: true } }, property: { select: { name: true } } },
    });

    // Notify admin of new application (not when the admin logged it themselves)
    try {
      const settings = await db.settings.findFirst();
      if (!isAdmin && settings?.companyEmail) {
        await sendEmail({
          to: settings.companyEmail,
          subject: `New ${application.applicationType} Application from ${firstName} ${lastName}`,
          body: `A new application has been submitted.\n\nApplicant: ${firstName} ${lastName}${businessName ? ` (${businessName})` : ""}\nEmail: ${email}\nPhone: ${phone}\nType: ${applicationType || "RESIDENTIAL"}${application.property ? `\nProperty: ${application.property.name}${application.unit ? ` Unit ${application.unit.unitNumber}` : ""}` : ""}${intendedUse ? `\nIntended use: ${intendedUse}` : ""}${desiredTerm ? `\nDesired term: ${desiredTerm}` : ""}${guarantorName ? `\nGuarantor: ${guarantorName}` : ""}\n\nPlease log in to the admin portal to review.`,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send application email:", emailErr);
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

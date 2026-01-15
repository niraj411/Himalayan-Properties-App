import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await db.application.findMany({
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Public endpoint for application submission
export async function POST(request: Request) {
  try {
    const data = await request.json();
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
    } = data;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate commercial application required fields
    if (applicationType === "COMMERCIAL") {
      if (!businessName || !taxReturnsUrl || !bankStatementsUrl) {
        return NextResponse.json({ error: "Commercial applications require business name, tax returns, and bank statements" }, { status: 400 });
      }
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
        taxReturnsUrl,
        bankStatementsUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

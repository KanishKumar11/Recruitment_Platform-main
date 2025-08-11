import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import SupportTicket from "@/app/models/SupportTicket";
import connectDb from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    // Verify authentication and admin/internal role
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !["ADMIN", "INTERNAL"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get current date for time-based queries
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate ticket statistics
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      todayTickets,
      weekTickets,
      monthTickets,
      priorityStats,
      categoryStats,
      avgResponseTime,
    ] = await Promise.all([
      // Total tickets
      SupportTicket.countDocuments(),

      // Status counts
      SupportTicket.countDocuments({ status: "Open" }),
      SupportTicket.countDocuments({ status: "In Progress" }),
      SupportTicket.countDocuments({ status: "Resolved" }),
      SupportTicket.countDocuments({ status: "Closed" }),

      // Time-based counts
      SupportTicket.countDocuments({ createdAt: { $gte: startOfDay } }),
      SupportTicket.countDocuments({ createdAt: { $gte: startOfWeek } }),
      SupportTicket.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Priority distribution
      SupportTicket.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),

      // Category distribution
      SupportTicket.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),

      // Average response time (for resolved tickets with responses)
      SupportTicket.aggregate([
        {
          $match: {
            status: { $in: ["Resolved", "Closed"] },
            "responses.0": { $exists: true },
          },
        },
        {
          $addFields: {
            firstResponseTime: {
              $subtract: [
                { $arrayElemAt: ["$responses.createdAt", 0] },
                "$createdAt",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$firstResponseTime" },
          },
        },
      ]),
    ]);

    // Format priority stats
    const priorityDistribution = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    priorityStats.forEach((stat) => {
      if (stat._id && stat._id in priorityDistribution) {
        priorityDistribution[stat._id as keyof typeof priorityDistribution] =
          stat.count;
      }
    });

    // Format category stats
    const categoryDistribution: Record<string, number> = {};
    categoryStats.forEach((stat) => {
      if (stat._id) {
        categoryDistribution[stat._id] = stat.count;
      }
    });

    // Calculate average response time in hours
    const avgResponseTimeHours =
      avgResponseTime.length > 0
        ? Math.round(
            ((avgResponseTime[0].avgResponseTime || 0) / (1000 * 60 * 60)) * 10
          ) / 10
        : 0;

    // Calculate resolution rate
    const resolvedCount = resolvedTickets + closedTickets;
    const resolutionRate =
      totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;

    const stats = {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      byPriority: priorityDistribution,
      byCategory: categoryDistribution,
      // Additional stats for potential future use
      resolutionRate,
      timeBasedCounts: {
        today: todayTickets,
        thisWeek: weekTickets,
        thisMonth: monthTickets,
      },
      performance: {
        avgResponseTimeHours,
        totalResolved: resolvedCount,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket statistics" },
      { status: 500 }
    );
  }
}

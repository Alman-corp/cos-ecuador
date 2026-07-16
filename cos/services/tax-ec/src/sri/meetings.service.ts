import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  async findByClient(clientId: string) {
    return this.prisma.meeting.findMany({
      where: { clientCompanyId: clientId },
      orderBy: { scheduledAt: "desc" },
    })
  }

  async findById(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        clientCompany: { select: { id: true, name: true } },
      },
    })
    if (!meeting) throw new NotFoundException("Meeting not found")
    return meeting
  }

  async create(data: {
    clientCompanyId: string
    title: string
    description?: string
    meetingType?: string
    scheduledAt: string
    durationMinutes?: number
    location?: string
    meetingUrl?: string
    organizedBy: string
  }) {
    const client = await this.prisma.clientCompany.findUnique({ where: { id: data.clientCompanyId } })
    if (!client) throw new BadRequestException("Client not found")

    return this.prisma.meeting.create({
      data: {
        clientCompanyId: data.clientCompanyId,
        title: data.title,
        description: data.description,
        meetingType: data.meetingType || "review",
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes || 60,
        location: data.location,
        meetingUrl: data.meetingUrl,
        organizedBy: data.organizedBy,
        status: "scheduled",
      },
    })
  }

  async update(id: string, data: Partial<{
    title: string
    description: string
    meetingType: string
    scheduledAt: string
    durationMinutes: number
    location: string
    meetingUrl: string
    status: string
  }>) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } })
    if (!meeting) throw new NotFoundException("Meeting not found")

    const updateData: any = { ...data }
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt)

    return this.prisma.meeting.update({ where: { id }, data: updateData })
  }

  async complete(id: string, minutes?: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } })
    if (!meeting) throw new NotFoundException("Meeting not found")
    return this.prisma.meeting.update({
      where: { id },
      data: { status: "completed", minutes: minutes || null },
    })
  }

  async cancel(id: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } })
    if (!meeting) throw new NotFoundException("Meeting not found")
    return this.prisma.meeting.update({
      where: { id },
      data: { status: "cancelled" },
    })
  }

  async remove(id: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } })
    if (!meeting) throw new NotFoundException("Meeting not found")
    return this.prisma.meeting.delete({ where: { id } })
  }
}

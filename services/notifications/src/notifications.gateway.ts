import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

@WebSocketGateway({
  namespace: "/notifications",
  cors: {
    origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private userSockets = new Map<string, Set<string>>()
  private supabase: SupabaseClient

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query.token as string)

      if (!token) {
        client.emit("error", { message: "No autenticado" })
        client.disconnect()
        return
      }

      let payload: any
      try {
        payload = await this.jwt.verifyAsync(token)
      } catch {
        client.emit("error", { message: "Token inválido" })
        client.disconnect()
        return
      }

      const userId = payload.sub ?? payload.user_id
      const companyId = payload.tenant_id ?? payload.company_id

      if (!userId || !companyId) {
        client.emit("error", { message: "Token inválido" })
        client.disconnect()
        return
      }

      client.data.userId = userId
      client.data.companyId = companyId

      const roomKey = `${companyId}:${userId}`
      client.join(roomKey)

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set())
      }
      this.userSockets.get(userId)!.add(client.id)

      const { data: unread } = await this.supabase
        .from("notifications")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20)

      client.emit("initial_state", {
        unreadCount: unread?.length ?? 0,
        notifications: unread ?? [],
      })
    } catch (err) {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id)
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }

  @SubscribeMessage("mark_read")
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const { userId, companyId } = client.data
    await this.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", data.notificationId)
      .eq("company_id", companyId)
      .eq("user_id", userId)

    const roomKey = `${companyId}:${userId}`
    this.server.to(roomKey).emit("notification_read", {
      notificationId: data.notificationId,
    })
    return { success: true }
  }

  @SubscribeMessage("mark_all_read")
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const { userId, companyId } = client.data
    await this.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .eq("is_read", false)

    const roomKey = `${companyId}:${userId}`
    this.server.to(roomKey).emit("all_read")
    return { success: true }
  }

  pushToUser(companyId: string, userId: string, notification: any) {
    const roomKey = `${companyId}:${userId}`
    this.server.to(roomKey).emit("new_notification", notification)
  }

  pushToTenant(companyId: string, event: string, data: any) {
    this.server.to(`tenant:${companyId}`).emit(event, data)
  }
}

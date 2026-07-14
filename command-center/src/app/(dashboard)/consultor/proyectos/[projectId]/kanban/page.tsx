'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'

interface Task {
  id: string; title: string; description?: string; status: string; priority: string; assigneeName?: string; dueDate?: string; tags?: string[]
}

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'todo', title: 'Por Hacer', color: 'bg-blue-50' },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-yellow-50' },
  { id: 'review', title: 'En Revisión', color: 'bg-purple-50' },
  { id: 'done', title: 'Completado', color: 'bg-green-50' },
]

const PRIORITY_COLORS: Record<string, string> = { low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-orange-500', urgent: 'bg-red-500' }

export default function KanbanPage({ params }: { params: { projectId: string } }) {
  const queryClient = useQueryClient()
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks', params.projectId],
    queryFn: () => api.get<Task[]>(`/api/v1/projects/${params.projectId}/tasks`),
  })

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => api.patch(`/api/v1/tasks/${taskId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', params.projectId] }),
  })

  const getTasksByStatus = (status: string) => tasks.filter((t: Task) => t.status === status)

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tablero Kanban</h1>
        <Button><Plus className="h-4 w-4 mr-2" />Nueva Tarea</Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map(column => (
          <div key={column.id} className={`${column.color} rounded-lg p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
            </div>
            <div
              className="space-y-2 min-h-[200px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedTask) updateTaskStatus.mutate({ taskId: draggedTask, status: column.id })
                setDraggedTask(null)
              }}
            >
              {getTasksByStatus(column.id).map(task => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTask(task.id)}
                  className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-gray-400'}`} />
                    </div>
                    <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                    {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

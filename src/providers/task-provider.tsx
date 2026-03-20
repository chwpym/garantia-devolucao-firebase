'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowRight, ArrowLeft, X, CheckCircle2, Circle, Pencil, Check } from 'lucide-react';
import * as db from '@/lib/db';
import { TaskItem } from '@/lib/db';

interface TaskContextType {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    tasks: TaskItem[];
    reloadTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function useTaskModal() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTaskModal deve ser usado dentro de um TaskProvider');
    }
    return context;
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // States para criar nova tarefa
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await db.getAllTasks();
            setTasks(data);
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!newTitle.trim()) return;

        const task: Omit<TaskItem, 'id'> = {
            titulo: newTitle.trim(),
            descricao: newDesc.trim(),
            status: 'todo',
            dataCriacao: new Date().toISOString()
        };

        try {
            await db.addTask(task);
            setNewTitle('');
            setNewDesc('');
            loadTasks();
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
        }
    };

    const handleMoveTask = async (task: TaskItem, nextStatus: 'todo' | 'doing' | 'done') => {
        try {
            await db.updateTask({ ...task, status: nextStatus });
            loadTasks();
        } catch (error) {
            console.error('Erro ao mover tarefa:', error);
        }
    };

    const handleDeleteTask = async (id: number) => {
        try {
            await db.deleteTask(id);
            loadTasks();
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);
        }
    };

    return (
        <TaskContext.Provider value={{ isOpen, openModal: () => setIsOpen(true), closeModal: () => setIsOpen(false), tasks, reloadTasks: loadTasks }}>
            {children}



            {/* --- Modal Trello Global --- */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-6xl max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl border flex flex-col m-4 animate-in fade-in-0 zoom-in-95">
                        
                        {/* Header do Modal */}
                        <div className="p-5 border-b flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" /> Quadro de Tarefas
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Gerencie suas anotações e atividades diárias rapidamente.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Área de Criação de Tarefa */}
                        <div className="p-5 border-b bg-muted/20">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div className="space-y-1 md:col-span-1">
                                    <Label className="text-xs">Título da Tarefa</Label>
                                    <Input placeholder="O que precisa ser feito?" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <Label className="text-xs">Descrição (Opcional)</Label>
                                    <Input placeholder="Detalhes..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <Button onClick={handleAddTask} size="sm" className="gap-1 h-8">
                                    <Plus className="h-3.5 w-3.5" /> Adicionar
                                </Button>
                            </div>
                        </div>

                        {/* Quadros Kanban */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
                            
                            {/* COLUNA: A FAZER */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-1.5 mb-2 px-1">
                                    <Circle className="h-3 w-3 text-red-400 fill-red-400" />
                                    <span className="text-sm font-semibold">A Fazer</span>
                                    <span className="text-xs text-muted-foreground ml-auto bg-muted px-1.5 rounded">{tasks.filter(t => t.status === 'todo').length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 border rounded-md p-2 bg-muted/10 min-h-[150px]">
                                    {tasks.filter(t => t.status === 'todo').map(task => (
                                        <Card key={task.id} className="shadow-sm border bg-card/50">
                                            <CardContent className="p-3">
                                                {editingTaskId === task.id ? (
                                                    <div className="space-y-1 p-1">
                                                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-xs px-1" />
                                                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="h-7 text-xs px-1 text-muted-foreground" placeholder="Descrição..." />
                                                        <div className="flex gap-1 justify-end mt-1">
                                                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingTaskId(null)}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-green-500" onClick={handleUpdateTask}>
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-bold">{task.titulo}</p>
                                                        {task.descricao && <p className="text-xs text-muted-foreground mt-1">{task.descricao}</p>}
                                                    </>
                                                )}
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                                                    <div className="flex items-center gap-0.5">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-primary/10" onClick={() => { setEditingTaskId(task.id!); setEditTitle(task.titulo); setEditDesc(task.descricao || ''); }}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => task.id && handleDeleteTask(task.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Button size="sm" variant="outline" className="h-6 gap-1 text-xs" onClick={() => handleMoveTask(task, 'doing')}>
                                                        Fazer <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* COLUNA: FAZENDO */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-1.5 mb-2 px-1">
                                    <Circle className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-semibold">Fazendo</span>
                                    <span className="text-xs text-muted-foreground ml-auto bg-muted px-1.5 rounded">{tasks.filter(t => t.status === 'doing').length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 border rounded-md p-2 bg-muted/10 min-h-[150px]">
                                    {tasks.filter(t => t.status === 'doing').map(task => (
                                        <Card key={task.id} className="shadow-sm border bg-card/50">
                                            <CardContent className="p-3">
                                                {editingTaskId === task.id ? (
                                                    <div className="space-y-1 p-1">
                                                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-xs px-1" />
                                                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="h-7 text-xs px-1 text-muted-foreground" placeholder="Descrição..." />
                                                        <div className="flex gap-1 justify-end mt-1">
                                                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingTaskId(null)}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-green-500" onClick={handleUpdateTask}>
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-bold">{task.titulo}</p>
                                                        {task.descricao && <p className="text-xs text-muted-foreground mt-1">{task.descricao}</p>}
                                                    </>
                                                )}
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                                                    <div className="flex items-center gap-1">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleMoveTask(task, 'todo')}>
                                                            <ArrowLeft className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-primary/10" onClick={() => { setEditingTaskId(task.id!); setEditTitle(task.titulo); setEditDesc(task.descricao || ''); }}>
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <Button size="sm" variant="outline" className="h-6 gap-1 text-xs border-green-500/20 hover:bg-green-500/10" onClick={() => handleMoveTask(task, 'done')}>
                                                        Pronto <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* COLUNA: FEITO */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-1.5 mb-2 px-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span className="text-sm font-semibold">Feito</span>
                                    <span className="text-xs text-muted-foreground ml-auto bg-muted px-1.5 rounded">{tasks.filter(t => t.status === 'done').length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 border rounded-md p-2 bg-muted/10 min-h-[150px]">
                                    {tasks.filter(t => t.status === 'done').map(task => (
                                        <Card key={task.id} className="shadow-sm border bg-card/50 bg-green-500/5">
                                            <CardContent className="p-3">
                                                {editingTaskId === task.id ? (
                                                    <div className="space-y-1 p-1">
                                                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-xs px-1" />
                                                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="h-7 text-xs px-1 text-muted-foreground" placeholder="Descrição..." />
                                                        <div className="flex gap-1 justify-end mt-1">
                                                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingTaskId(null)}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-green-500" onClick={handleUpdateTask}>
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-bold line-through text-muted-foreground">{task.titulo}</p>
                                                        {task.descricao && <p className="text-xs text-muted-foreground mt-1 line-through">{task.descricao}</p>}
                                                    </>
                                                )}
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleMoveTask(task, 'doing')}>
                                                        <ArrowLeft className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <div className="flex items-center gap-0.5">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-primary/10" onClick={() => { setEditingTaskId(task.id!); setEditTitle(task.titulo); setEditDesc(task.descricao || ''); }}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => task.id && handleDeleteTask(task.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </TaskContext.Provider>
    );
}

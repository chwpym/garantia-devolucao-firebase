'use client'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Search, PlusSquare, Users, Building, Package, FolderKanban, Wrench } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


interface MobileSidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    isCollapsed?: boolean;
    className?: string;
}

const navItems = {
  dashboard: { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  reports: { id: 'reports', label: 'Relatório de Garantias', icon: FileText },
};

const garantiaNavItems = [
    { id: 'register', label: 'Cadastro de Garantia', icon: PlusSquare },
    { id: 'query', label: 'Consulta de Garantias', icon: Search },
    { id: 'lotes', label: 'Lotes de Garantia', icon: Package },
];

const cadastroNavItems = [
    { id: 'persons', label: 'Clientes/Mecânicos', icon: Users },
    { id: 'suppliers', label: 'Fornecedores', icon: Building },
];

export default function MobileSidebar({ activeView, onNavigate, isCollapsed, className }: MobileSidebarProps) {
    
    const isCadastroActive = cadastroNavItems.some(item => item.id === activeView);
    const isGarantiaActive = garantiaNavItems.some(item => item.id === activeView);
    const isReportActive = activeView === 'reports';

    const renderNavItem = (item: { id: string; label: string; icon: React.ElementType }) => (
         <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className={cn(
                "justify-start gap-3 text-base h-11",
                isCollapsed && "justify-center"
            )}
            onClick={() => onNavigate(item.id)}
            title={isCollapsed ? item.label : undefined}
        >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className={cn("truncate", isCollapsed && "hidden")}>{item.label}</span>
        </Button>
    )
    
    return (
        <div className={className}>
            <nav className="flex flex-col gap-1 px-4">
                {renderNavItem(navItems.dashboard)}
                
                <Accordion 
                    type="single" 
                    collapsible 
                    defaultValue={isCadastroActive ? "cadastros" : isGarantiaActive ? "garantias" : isReportActive ? "reports" : undefined} 
                    className="w-full"
                >
                    <AccordionItem value="cadastros" className="border-b-0">
                        <AccordionTrigger 
                            className={cn(
                                "justify-start gap-3 text-base h-11 font-normal rounded-md hover:no-underline hover:bg-accent px-4 py-2",
                                isCollapsed && "justify-center p-0",
                                isCadastroActive && !isCollapsed ? "bg-accent" : ""
                            )}
                            title={isCollapsed ? "Cadastros" : undefined}
                        >
                             <div className="flex items-center gap-3">
                                <FolderKanban className="h-5 w-5 flex-shrink-0" />
                                <span className={cn("truncate", isCollapsed && "hidden")}>Cadastros</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className={cn("pb-1", isCollapsed && "hidden")}>
                            <div className="flex flex-col gap-1 pl-4 pt-1">
                                 {cadastroNavItems.map(item => (
                                    <Button
                                        key={item.id}
                                        variant={activeView === item.id ? 'secondary' : 'ghost'}
                                        className={cn("justify-start gap-3 text-base h-11")}
                                        onClick={() => onNavigate(item.id)}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        <span>{item.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="garantias" className="border-b-0">
                        <AccordionTrigger 
                            className={cn(
                                "justify-start gap-3 text-base h-11 font-normal rounded-md hover:no-underline hover:bg-accent px-4 py-2",
                                isCollapsed && "justify-center p-0",
                                isGarantiaActive && !isCollapsed ? "bg-accent" : ""
                            )}
                            title={isCollapsed ? "Garantias" : undefined}
                        >
                             <div className="flex items-center gap-3">
                                <Wrench className="h-5 w-5 flex-shrink-0" />
                                <span className={cn("truncate", isCollapsed && "hidden")}>Garantias</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className={cn("pb-1", isCollapsed && "hidden")}>
                            <div className="flex flex-col gap-1 pl-4 pt-1">
                                 {garantiaNavItems.map(item => (
                                    <Button
                                        key={item.id}
                                        variant={activeView === item.id ? 'secondary' : 'ghost'}
                                        className={cn("justify-start gap-3 text-base h-11")}
                                        onClick={() => onNavigate(item.id)}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        <span>{item.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="reports" className="border-b-0">
                        <AccordionTrigger 
                            className={cn(
                                "justify-start gap-3 text-base h-11 font-normal rounded-md hover:no-underline hover:bg-accent px-4 py-2",
                                isCollapsed && "justify-center p-0",
                                isReportActive && !isCollapsed ? "bg-accent" : ""
                            )}
                            title={isCollapsed ? "Relatórios" : undefined}
                        >
                             <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 flex-shrink-0" />
                                <span className={cn("truncate", isCollapsed && "hidden")}>Relatórios</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className={cn("pb-1", isCollapsed && "hidden")}>
                            <div className="flex flex-col gap-1 pl-4 pt-1">
                                <Button
                                    key={navItems.reports.id}
                                    variant={activeView === navItems.reports.id ? 'secondary' : 'ghost'}
                                    className={cn("justify-start gap-3 text-base h-11")}
                                    onClick={() => onNavigate(navItems.reports.id)}
                                >
                                    <navItems.reports.icon className="h-5 w-5 flex-shrink-0" />
                                    <span>{navItems.reports.label}</span>
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </nav>
        </div>
    )
}

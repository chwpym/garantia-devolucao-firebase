
'use client'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { navConfig, type NavItem } from "@/config/nav-config";
import { useAuth } from "@/hooks/use-auth";


interface MobileSidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    className?: string;
}

export default function MobileSidebar({ activeView, onNavigate, className }: MobileSidebarProps) {
    const { user } = useAuth();
    const isAdmin = user?.profile?.role === 'admin';

    const renderNavItem = (item: NavItem) => {
        if (item.adminOnly && !isAdmin) {
            return null;
        }
        return (
         <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className="justify-start gap-3 text-base h-11 w-full"
            onClick={() => onNavigate(item.id)}
            title={item.label}
        >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
        </Button>
        );
    }

    const renderAccordionItem = (item: NavItem) => {
        if (!item.items || (item.adminOnly && !isAdmin)) {
            return null;
        }

        const visibleSubItems = item.items.filter(subItem => !subItem.adminOnly || isAdmin);
        if (visibleSubItems.length === 0) {
            return null;
        }

        const isGroupActive = visibleSubItems.some(subItem => subItem.id === activeView);

        return (
            <AccordionItem value={item.id} className="border-b-0" key={item.id}>
                <AccordionTrigger 
                    className={cn(
                        "justify-start gap-3 text-base h-11 font-normal rounded-md hover:no-underline hover:bg-accent px-4 py-2",
                        isGroupActive ? "bg-accent" : ""
                    )}
                    title={item.label}
                >
                     <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                    <div className="flex flex-col gap-1 pl-4 pt-1">
                         {visibleSubItems.map(subItem => (
                            <Button
                                key={subItem.id}
                                variant={activeView === subItem.id ? 'secondary' : 'ghost'}
                                className="justify-start gap-3 text-base h-11"
                                onClick={() => onNavigate(subItem.id)}
                            >
                                <subItem.icon className="h-5 w-5 flex-shrink-0" />
                                <span>{subItem.label}</span>
                            </Button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        )
    }

    const defaultAccordionValue = navConfig.find(item => item.items?.some(subItem => subItem.id === activeView))?.id;
    
    return (
        <div className={className}>
            <nav className="flex flex-col gap-1 px-4">
                 <Accordion 
                    type="single" 
                    collapsible 
                    defaultValue={defaultAccordionValue}
                    className="w-full"
                >
                    {navConfig.map(item => (
                        item.items ? renderAccordionItem(item) : renderNavItem(item)
                    ))}
                </Accordion>
            </nav>
        </div>
    )
}

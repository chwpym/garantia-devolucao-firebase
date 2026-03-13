
'use client'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { navConfig, type NavItem } from "@/config/nav-config";
import { useAuth } from "@/hooks/use-auth";
import Link from 'next/link';
import { usePathname } from 'next/navigation';


interface MobileSidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    setMobileMenuOpen?: (open: boolean) => void;
    className?: string;
    isCollapsed?: boolean;
}

export default function MobileSidebar({ activeView, onNavigate, setMobileMenuOpen, className, isCollapsed = false }: MobileSidebarProps) {
    const { user } = useAuth();
    const isAdmin = user?.profile?.role === 'admin';

    const pathname = usePathname();

    const renderNavItem = (item: NavItem) => {
        if (item.adminOnly && !isAdmin) {
            return null;
        }

        const isActive = pathname === item.href || activeView === item.id;

        const content = (
            <>
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
            </>
        );

        if (item.href) {
            return (
                <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                        "justify-start gap-3 text-base h-11 w-full",
                        isCollapsed && "justify-center px-0"
                    )}
                    asChild
                    onClick={() => setMobileMenuOpen?.(false)}
                    title={isCollapsed ? item.label : ""}
                >
                    <Link href={item.href} prefetch={false}>
                        {content}
                    </Link>
                </Button>
            );
        }

        return (
            <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                    "justify-start gap-3 text-base h-11 w-full",
                    isCollapsed && "justify-center px-0"
                )}
                onClick={() => onNavigate(item.id)}
                title={item.label}
            >
                {content}
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

        const isGroupActive = visibleSubItems.some(subItem => pathname === subItem.href || subItem.id === activeView);

        return (
            <AccordionItem value={item.id} className="border-b-0" key={item.id}>
                <AccordionTrigger 
                    className={cn(
                        "justify-start gap-3 text-base h-11 font-normal rounded-md hover:no-underline hover:bg-accent px-4 py-2",
                        isGroupActive ? "bg-accent" : "",
                        isCollapsed && "justify-center px-0"
                    )}
                    title={item.label}
                    hideChevron={true}
                >
                     <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                    <div className="flex flex-col gap-1 pl-4 pt-1">
                         {visibleSubItems.map(subItem => {
                             const isSubActive = pathname === subItem.href || activeView === subItem.id;
                             const subContent = (
                                <>
                                    <subItem.icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed && "mx-auto")} />
                                    {!isCollapsed && <span>{subItem.label}</span>}
                                </>
                             );

                             if (subItem.href) {
                                 return (
                                    <Button
                                        key={subItem.id}
                                        variant={isSubActive ? 'secondary' : 'ghost'}
                                        className={cn(
                                            "justify-start gap-3 text-base h-11",
                                            isCollapsed && "justify-center px-0"
                                        )}
                                        asChild
                                        onClick={() => setMobileMenuOpen?.(false)}
                                        title={isCollapsed ? subItem.label : ""}
                                    >
                                        <Link href={subItem.href} prefetch={false}>
                                            {subContent}
                                        </Link>
                                    </Button>
                                 );
                             }

                             return (
                                <Button
                                    key={subItem.id}
                                    variant={isSubActive ? 'secondary' : 'ghost'}
                                    className={cn(
                                        "justify-start gap-3 text-base h-11",
                                        isCollapsed && "justify-center px-0"
                                    )}
                                    onClick={() => onNavigate(subItem.id)}
                                    title={isCollapsed ? subItem.label : ""}
                                >
                                    {subContent}
                                </Button>
                             );
                         })}
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


import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    MoreHorizontal,
    Share2,
    Users,
    Edit2,
    Pin,
    Archive,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatActionMenuProps {
    chatId: string;
    onRename: () => void;
    onDelete: () => void;
    onShare: () => void;
    chatTitle: string;
}

export function ChatActionMenu({ chatId, onRename, onDelete, onShare, chatTitle }: ChatActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    const updatePosition = () => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position the menu to the right of the button, slightly raised
            const top = rect.top - 10;
            const left = rect.right + 10;

            // Ensure it doesn't go off screen vertically
            // (Simple logic, can be improved with more robust positioning lib like floating-ui if needed)

            setMenuStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 9999, // Ensure it's above everything
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                // Check if click is inside the menu (which is in a portal)
                const menu = document.getElementById(`chat-menu-${chatId}`);
                if (menu && !menu.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, chatId]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-1 rounded-md text-text-muted hover:text-text hover:bg-sidebar-hover transition-colors ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                title="More options"
                aria-label={`Options for ${chatTitle}`}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            id={`chat-menu-${chatId}`}
                            initial={{ opacity: 0, scale: 0.95, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -10 }}
                            transition={{ duration: 0.1 }}
                            style={menuStyle}
                            className="w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden py-1 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MenuItem
                                icon={Share2}
                                label="Share"
                                onClick={() => handleAction(onShare)}
                            />
                            <MenuItem
                                icon={Users}
                                label="Start a group chat"
                                onClick={() => handleAction(() => console.log('Group chat not implemented'))}
                            />
                            <MenuItem
                                icon={Edit2}
                                label="Rename"
                                onClick={() => handleAction(onRename)}
                            />
                            <div className="h-px bg-border my-1" />
                            <MenuItem
                                icon={Pin}
                                label="Pin chat"
                                onClick={() => handleAction(() => console.log('Pin not implemented'))}
                            />
                            <MenuItem
                                icon={Archive}
                                label="Archive"
                                onClick={() => handleAction(() => console.log('Archive not implemented'))}
                            />
                            <div className="h-px bg-border my-1" />
                            <MenuItem
                                icon={Trash2}
                                label="Delete"
                                onClick={() => handleAction(onDelete)}
                                variants="danger"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

interface MenuItemProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    variants?: 'default' | 'danger';
}

function MenuItem({ icon: Icon, label, onClick, variants = 'default' }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left
                ${variants === 'danger'
                    ? 'text-error hover:bg-error/10'
                    : 'text-text hover:bg-sidebar-hover'
                }`}
        >
            <Icon className="w-4 h-4 opacity-70" />
            <span>{label}</span>
        </button>
    );
}

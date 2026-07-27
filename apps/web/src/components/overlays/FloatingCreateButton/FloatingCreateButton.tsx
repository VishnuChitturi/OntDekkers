"use client";

/**
 * OntDekker FloatingCreateButton (FAB)
 *
 * Fixed bottom-right button that expands into a radial menu of three
 * create actions: Story, Community, Expedition.
 *
 * Motion:
 *   Main button: rotate 0 → 45deg on open (Plus → X)
 *   Options: stagger 60ms, scale 0 → 1, y 8 → 0  ease spring
 *   Backdrop: opacity 0 → 1 duration 150ms
 *
 * State:
 *   isCreateMenuOpen from AppState — toggled via CREATE_MENU_TOGGLE dispatch
 *
 * Accessibility:
 *   aria-expanded on main button
 *   aria-label per option button
 *   Escape closes
 */

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, BookOpen, Users, Compass } from "lucide-react";
import { useAppState } from "@/contexts/AppStateProvider";
import { useRouter } from "@/router/Router";

// ---------------------------------------------------------------------------
// Option definition
// ---------------------------------------------------------------------------

interface FabOption {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

// ---------------------------------------------------------------------------
// FloatingCreateButton
// ---------------------------------------------------------------------------

export default function FloatingCreateButton() {
  const { state, dispatch } = useAppState();
  const { navigateTo } = useRouter();
  const isOpen = state.isCreateMenuOpen;

  function toggle() {
    dispatch({ type: "CREATE_MENU_TOGGLE" });
  }

  function close() {
    dispatch({ type: "CREATE_MENU_TOGGLE", open: false });
  }

  // Escape to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const options: FabOption[] = [
    {
      id: "story",
      label: "New Story",
      icon: BookOpen,
      onClick: () => {
        close();
        navigateTo("discover");
      },
    },
    {
      id: "community",
      label: "New Community",
      icon: Users,
      onClick: () => {
        close();
        navigateTo("communities");
      },
    },
    {
      id: "expedition",
      label: "New Expedition",
      icon: Compass,
      onClick: () => {
        close();
        navigateTo("my-trips");
      },
    },
  ];

  return (
    <>
      {/* Backdrop — closes menu on click */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[45]"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* FAB container — fixed bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-[46] flex flex-col-reverse items-center gap-3"
        role="group"
        aria-label="Create options"
      >
        {/* Option buttons — rendered above the main button */}
        <AnimatePresence>
          {isOpen &&
            options.map((option, i) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.id}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.7, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: 8 }}
                  transition={{
                    delay: i * 0.06,
                    duration: 0.25,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  {/* Label chip */}
                  <span className="text-xs font-medium text-ink bg-white shadow-sm border border-gray-100 px-3 py-1.5 rounded-xl whitespace-nowrap">
                    {option.label}
                  </span>
                  {/* Icon button */}
                  <button
                    type="button"
                    aria-label={option.label}
                    onClick={option.onClick}
                    className="
                      w-11 h-11 rounded-full bg-white shadow-md border border-gray-100
                      flex items-center justify-center
                      text-charcoal hover:bg-gray-50 hover:text-ink
                      transition-colors duration-[var(--duration-responsive)]
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
                    "
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          type="button"
          aria-label={isOpen ? "Close create menu" : "Open create menu"}
          aria-expanded={isOpen}
          onClick={toggle}
          className="
            w-14 h-14 rounded-full bg-ink text-white shadow-lg
            flex items-center justify-center
            hover:bg-neutral-800
            transition-colors duration-[var(--duration-responsive)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          "
          whileTap={{ scale: 0.93 }}
        >
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="flex items-center justify-center"
          >
            <Plus size={24} strokeWidth={2} aria-hidden="true" />
          </motion.span>
        </motion.button>
      </div>
    </>
  );
}

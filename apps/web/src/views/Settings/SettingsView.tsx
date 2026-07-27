"use client";

/**
 * OntDekker SettingsView
 *
 * Account preferences form.
 *
 * Sections:
 *   Profile       — display name, bio (persisted to user-service in Phase 2)
 *   Notifications — email + push toggles
 *   Appearance    — theme placeholder (Phase 2)
 *
 * Controlled inputs; save button shows loading state.
 * All styling uses design system tokens (no hardcoded colours).
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Bell, Palette, Save } from "lucide-react";

import Button from "@/components/feedback/Button";
import { useAppState } from "@/contexts/AppStateProvider";

// ---------------------------------------------------------------------------
// Input field
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-mono uppercase tracking-wider text-muted-slate mb-1.5">
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Icon size={15} strokeWidth={2} className="text-charcoal" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-ink cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-muted-slate mt-0.5">{description}</p>
      </div>
      {/* Toggle */}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-[var(--duration-responsive)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          checked ? "bg-ink" : "bg-gray-200",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow",
            "transform transition-transform duration-[var(--duration-responsive)]",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
        <span className="sr-only">{checked ? "Enabled" : "Disabled"}</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettingsView
// ---------------------------------------------------------------------------

export default function SettingsView() {
  const { state } = useAppState();
  const { user } = state;

  // ── Profile fields ────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState("");

  // ── Notification preferences ──────────────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // ── Form state ────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate async save — wired to user-service PATCH in Phase 2
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    setIsSaving(false);
    setSaveSuccess(true);

    // Clear the success indicator after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      <div className="container-main pt-6 space-y-6">
        {/* ── Page title ─────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-slate">
            Account
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">Settings</h1>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-5">
          {/* ── Profile section ──────────────────────────────────────────── */}
          <SettingsSection icon={User} title="Profile">
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="settings-display-name">Display name</FieldLabel>
                <input
                  id="settings-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={64}
                  placeholder="Your name"
                  autoComplete="name"
                  className="
                    w-full bg-gray-50 border border-gray-200 rounded-xl
                    px-4 py-2.5 text-sm text-ink
                    focus:outline-none focus:bg-white focus:border-ink focus:ring-1 focus:ring-ink
                    transition-all duration-[var(--duration-responsive)]
                    placeholder:text-muted-slate
                  "
                />
                <p className="mt-1 text-[10px] text-muted-slate font-mono">
                  {displayName.length}/64
                </p>
              </div>

              <div>
                <FieldLabel htmlFor="settings-bio">Bio</FieldLabel>
                <textarea
                  id="settings-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="A short introduction…"
                  className="
                    w-full bg-gray-50 border border-gray-200 rounded-xl
                    px-4 py-2.5 text-sm text-ink resize-none
                    focus:outline-none focus:bg-white focus:border-ink focus:ring-1 focus:ring-ink
                    transition-all duration-[var(--duration-responsive)]
                    placeholder:text-muted-slate
                  "
                />
                <p className="mt-1 text-[10px] text-muted-slate font-mono">
                  {bio.length}/300
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* ── Notifications section ─────────────────────────────────────── */}
          <SettingsSection icon={Bell} title="Notifications">
            <div className="space-y-4">
              <ToggleRow
                id="settings-email-notifications"
                label="Email notifications"
                description="Receive updates about expeditions, messages, and activity."
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
              <div className="border-t border-gray-50" />
              <ToggleRow
                id="settings-push-notifications"
                label="Push notifications"
                description="Get real-time alerts when you receive a message or invite."
                checked={pushNotifications}
                onChange={setPushNotifications}
              />
            </div>
          </SettingsSection>

          {/* ── Appearance section ────────────────────────────────────────── */}
          <SettingsSection icon={Palette} title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Theme</p>
                <p className="text-xs text-muted-slate mt-0.5">
                  Dark mode and custom themes coming in a future update.
                </p>
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-slate bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                Light
              </span>
            </div>
          </SettingsSection>

          {/* ── Save row ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSaving}
              icon={Save}
            >
              Save changes
            </Button>

            {saveSuccess && (
              <motion.p
                className="text-xs text-moss-green font-medium"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Changes saved.
              </motion.p>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
}

import React from 'react';

/**
 * Enterprise Form Keyboard Navigation Handler
 * Fulfills Master Prompt Section 6 & 7:
 * - Enter Key: Moves smoothly to the next logical input field (e.g. Market/Place Name -> City -> State -> Next Field).
 *   Prevents accidental premature form submission, doesn't interfere with dropdowns/pickers, and preserves textarea newlines.
 * - Shift + Arrow Up: Moves to the previous logical form section or previous application tab.
 */

export const handleFormKeyDown = (
  e: React.KeyboardEvent<HTMLElement>,
  options?: {
    onPreviousTab?: () => void;
    onPreviousSection?: () => void;
    containerRef?: React.RefObject<HTMLElement | null>;
  }
) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const tagName = target.tagName.toLowerCase();

  // 1. Shift + Arrow Up = Move to Previous Tab / Logical Section
  if (e.shiftKey && e.key === 'ArrowUp') {
    // Preserve normal cursor movement in multiline textarea
    if (tagName === 'textarea') return;

    e.preventDefault();
    if (options?.onPreviousSection) {
      options.onPreviousSection();
    } else if (options?.onPreviousTab) {
      options.onPreviousTab();
    }
    return;
  }

  // 2. Enter Key = Move to Next Logical Input Field
  if (e.key === 'Enter') {
    // Preserve Enter key inside multi-line textareas for line breaks
    if (tagName === 'textarea') return;

    // Do not interfere if user is explicitly pressing Enter on a button
    if (tagName === 'button' && (target as HTMLButtonElement).type !== 'button') return;

    // Prevent accidental form submission
    e.preventDefault();

    // Find the enclosing form or designated container
    const root =
      options?.containerRef?.current ||
      target.closest('form') ||
      target.closest('[data-form-container="true"]');

    if (!root) return;

    // Select all focusable form controls in document DOM order
    const focusableSelectors = [
      'input:not([type="hidden"]):not([disabled]):not([readonly])',
      'select:not([disabled]):not([readonly])',
      'textarea:not([disabled]):not([readonly])',
    ].join(', ');

    const allFocusables = Array.from(root.querySelectorAll<HTMLElement>(focusableSelectors)).filter((el) => {
      // Must be visible and interactive
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    });

    const currentIndex = allFocusables.indexOf(target);
    if (currentIndex !== -1 && currentIndex < allFocusables.length - 1) {
      const nextInput = allFocusables[currentIndex + 1];
      nextInput.focus();
      // If it's a text input, auto-select text for easy overwrite
      if (
        nextInput instanceof HTMLInputElement &&
        ['text', 'number', 'email', 'tel', 'search'].includes(nextInput.type)
      ) {
        try {
          nextInput.select();
        } catch {
          // ignore if select unsupported
        }
      }
    }
  }
};


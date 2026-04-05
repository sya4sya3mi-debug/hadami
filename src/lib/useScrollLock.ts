"use client";

import { RefObject, useEffect } from "react";

let activeLockCount = 0;
let lockedScrollX = 0;
let lockedScrollY = 0;

let originalHtmlOverflow = "";
let originalHtmlOverscrollBehavior = "";
let originalBodyPosition = "";
let originalBodyTop = "";
let originalBodyLeft = "";
let originalBodyRight = "";
let originalBodyWidth = "";
let originalBodyOverflow = "";
let originalBodyOverscrollBehavior = "";
let originalBodyPaddingRight = "";

function canScrollWithin(container: HTMLElement, deltaY: number) {
  if (container.scrollHeight <= container.clientHeight) return false;

  if (deltaY < 0) {
    return container.scrollTop > 0;
  }

  if (deltaY > 0) {
    return container.scrollTop + container.clientHeight < container.scrollHeight - 1;
  }

  return true;
}

function getAllowedContainer(target: EventTarget | null, scrollable: HTMLElement | null) {
  if (!scrollable || !(target instanceof Node) || !scrollable.contains(target)) {
    return null;
  }

  return scrollable;
}

function lockDocumentScroll() {
  if (activeLockCount > 0) {
    activeLockCount += 1;
    return;
  }

  activeLockCount = 1;
  lockedScrollX = window.scrollX;
  lockedScrollY = window.scrollY;

  const html = document.documentElement;
  const body = document.body;

  originalHtmlOverflow = html.style.overflow;
  originalHtmlOverscrollBehavior = html.style.overscrollBehavior;
  originalBodyPosition = body.style.position;
  originalBodyTop = body.style.top;
  originalBodyLeft = body.style.left;
  originalBodyRight = body.style.right;
  originalBodyWidth = body.style.width;
  originalBodyOverflow = body.style.overflow;
  originalBodyOverscrollBehavior = body.style.overscrollBehavior;
  originalBodyPaddingRight = body.style.paddingRight;

  const scrollbarGap = window.innerWidth - html.clientWidth;

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";

  body.style.position = "fixed";
  body.style.top = `-${lockedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";

  if (scrollbarGap > 0) {
    body.style.paddingRight = `${scrollbarGap}px`;
  }
}

function unlockDocumentScroll() {
  if (activeLockCount === 0) return;

  activeLockCount -= 1;
  if (activeLockCount > 0) return;

  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = originalHtmlOverflow;
  html.style.overscrollBehavior = originalHtmlOverscrollBehavior;

  body.style.position = originalBodyPosition;
  body.style.top = originalBodyTop;
  body.style.left = originalBodyLeft;
  body.style.right = originalBodyRight;
  body.style.width = originalBodyWidth;
  body.style.overflow = originalBodyOverflow;
  body.style.overscrollBehavior = originalBodyOverscrollBehavior;
  body.style.paddingRight = originalBodyPaddingRight;

  window.scrollTo(lockedScrollX, lockedScrollY);
}

export function useScrollLock(locked: boolean, scrollableRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!locked) return;

    lockDocumentScroll();

    let startY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touchY = event.touches[0]?.clientY ?? startY;
      const deltaY = startY - touchY;
      const allowedContainer = getAllowedContainer(event.target, scrollableRef?.current ?? null);

      if (!allowedContainer) {
        event.preventDefault();
        return;
      }

      if (!canScrollWithin(allowedContainer, deltaY)) {
        event.preventDefault();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const allowedContainer = getAllowedContainer(event.target, scrollableRef?.current ?? null);

      if (!allowedContainer) {
        event.preventDefault();
        return;
      }

      if (!canScrollWithin(allowedContainer, event.deltaY)) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("touchmove", handleTouchMove, true);
      document.removeEventListener("wheel", handleWheel, true);
      unlockDocumentScroll();
    };
  }, [locked, scrollableRef]);
}

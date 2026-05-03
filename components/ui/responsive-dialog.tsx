"use client";

import * as React from "react";
import { useMobil } from "@/hooks/use-breakpoint";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Kural 13 (Mobile-First): mobilde bottom sheet, desktop'ta center modal.
// Tek API ile her iki primitive'i sarmalar; hook tek noktada (Root) çalışır
// ve child component'ler kendi useMobil çağrılarıyla aynı sonucu döndürür.

type RootProps = React.ComponentProps<typeof Dialog>;

function ResponsiveDialog(props: RootProps) {
  const mobil = useMobil();
  return mobil ? <Sheet {...props} /> : <Dialog {...props} />;
}

function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>,
) {
  const mobil = useMobil();
  return mobil ? <SheetTrigger {...props} /> : <DialogTrigger {...props} />;
}

function ResponsiveDialogClose(
  props: React.ComponentProps<typeof DialogClose>,
) {
  const mobil = useMobil();
  return mobil ? <SheetClose {...props} /> : <DialogClose {...props} />;
}

type ContentProps = React.ComponentProps<typeof SheetContent> & {
  // Sheet "side" prop'u sadece mobilde uygulanır; desktop'ta Dialog her zaman center.
  mobilTaraf?: "top" | "right" | "bottom" | "left";
};

function ResponsiveDialogContent({
  mobilTaraf = "bottom",
  side: _side,
  ...props
}: ContentProps) {
  const mobil = useMobil();
  if (mobil) {
    return <SheetContent side={mobilTaraf} {...props} />;
  }
  return <DialogContent {...props} />;
}

function ResponsiveDialogHeader(props: React.ComponentProps<"div">) {
  const mobil = useMobil();
  return mobil ? <SheetHeader {...props} /> : <DialogHeader {...props} />;
}

function ResponsiveDialogFooter(props: React.ComponentProps<typeof DialogFooter>) {
  const mobil = useMobil();
  return mobil ? <SheetFooter {...props} /> : <DialogFooter {...props} />;
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const mobil = useMobil();
  return mobil ? <SheetTitle {...props} /> : <DialogTitle {...props} />;
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  const mobil = useMobil();
  return mobil ? (
    <SheetDescription {...props} />
  ) : (
    <DialogDescription {...props} />
  );
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};

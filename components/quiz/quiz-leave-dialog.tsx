"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useId } from "react";

import { Button } from "@/components/ui/button";

type QuizLeaveDialogProps = {
  isOpen: boolean;
  onContinue: () => void;
  onLeave: () => void;
};

export function QuizLeaveDialog({
  isOpen,
  onContinue,
  onLeave,
}: QuizLeaveDialogProps) {
  const continueId = useId();

  useEffect(() => {
    if (isOpen) {
      document.getElementById(continueId)?.focus();
    }
  }, [continueId, isOpen]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onContinue();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-closed:opacity-0 data-open:opacity-100" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl outline-none">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Quizを終了しますか？
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              途中の回答内容は保存されません。
            </Dialog.Description>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                id={continueId}
                type="button"
                size="lg"
                onClick={onContinue}
                className="min-h-11 w-full rounded-full"
              >
                Quizを続ける
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={onLeave}
                className="min-h-11 w-full rounded-full"
              >
                Quizを終了する
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

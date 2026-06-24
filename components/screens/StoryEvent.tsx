"use client";

import { useGame } from "@/lib/store/gameStore";
import { ChoiceCard } from "@/components/game/Cards";
import { Button, Pill, ActionBar } from "@/components/ui";
import { pretty } from "@/lib/ui/format";

export function StoryEvent() {
  const event = useGame((s) => s.currentEvent)!;
  const resultText = useGame((s) => s.eventResultText);
  const chooseEvent = useGame((s) => s.chooseEvent);
  const dismiss = useGame((s) => s.dismissEventResult);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-4 pt-6 pb-2">
        <Pill color="var(--warn)">{pretty(event.category)}</Pill>
      </div>

      <div className="scroll-area flex-1 px-4 py-2">
        <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--text)]/90">{event.description}</p>

        {!resultText ? (
          <div className="mt-5 space-y-2">
            {event.choices.map((choice) => (
              <ChoiceCard
                key={choice.id}
                label={choice.label}
                description={choice.description}
                onClick={() => chooseEvent(choice.id)}
              />
            ))}
          </div>
        ) : (
          <div className="animate-pop mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
            <p className="text-[15px] leading-relaxed">{resultText}</p>
          </div>
        )}
      </div>

      {resultText && (
        <ActionBar>
          <Button full onClick={dismiss}>
            Continue
          </Button>
        </ActionBar>
      )}
    </div>
  );
}

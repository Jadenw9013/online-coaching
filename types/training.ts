import type { BlockType } from "@/app/generated/prisma/enums";

export type { BlockType };

export type TrainingBlock = {
  type: BlockType;
  title: string;
  content: string;
};

export type TrainingDayGroup = {
  dayName: string;
  blocks: TrainingBlock[];
};

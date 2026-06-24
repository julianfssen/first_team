import type { Career, WeeklyChoiceDef, WeeklyChoiceId } from "./types";

export const WEEKLY_CHOICES: Record<WeeklyChoiceId, WeeklyChoiceDef> = {
  TRAIN_FINISHING: {
    id: "TRAIN_FINISHING",
    label: "Train Finishing",
    description: "Sharpen your shooting in front of goal.",
    attributeGrowth: { finishing: 1.7, composure: 0.3 },
    statusEffects: { fatigue: 8 },
    traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }],
  },
  TRAIN_PASSING: {
    id: "TRAIN_PASSING",
    label: "Train Passing",
    description: "Work on range of passing and vision.",
    attributeGrowth: { passing: 1.3, vision: 1.0 },
    statusEffects: { fatigue: 7 },
    traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }],
  },
  TRAIN_DRIBBLING: {
    id: "TRAIN_DRIBBLING",
    label: "Train Dribbling",
    description: "Drill close control and 1v1 moves.",
    attributeGrowth: { dribbling: 1.7, pace: 0.3 },
    statusEffects: { fatigue: 8 },
    traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 3 }],
  },
  TRAIN_DEFENDING: {
    id: "TRAIN_DEFENDING",
    label: "Train Defending",
    description: "Improve tackling, marking and positioning.",
    attributeGrowth: { defending: 1.4, positioning: 0.9 },
    statusEffects: { fatigue: 8 },
    traitProgress: [{ traitId: "HARD_TACKLER", amount: 2 }],
  },
  TRAIN_FITNESS: {
    id: "TRAIN_FITNESS",
    label: "Train Fitness",
    description: "Build stamina, strength and work rate.",
    attributeGrowth: { stamina: 1.3, strength: 1.1, workRate: 0.8 },
    statusEffects: { fatigue: 10, injuryRisk: 3 },
  },
  TRAIN_GOALKEEPING: {
    id: "TRAIN_GOALKEEPING",
    label: "Train Goalkeeping",
    description: "Shot-stopping, handling and distribution.",
    positionFamilies: ["GOALKEEPER"],
    attributeGrowth: { goalkeeping: 1.7, positioning: 0.5 },
    statusEffects: { fatigue: 8 },
    traitProgress: [{ traitId: "SAFE_HANDS", amount: 3 }],
  },
  REST_RECOVER: {
    id: "REST_RECOVER",
    label: "Rest and Recover",
    description: "Recover fatigue and lower injury risk. Little growth.",
    statusEffects: { fatigue: -24, injuryRisk: -7, confidence: 2 },
  },
  STUDY_TACTICS: {
    id: "STUDY_TACTICS",
    label: "Study Tactics",
    description: "Film study — positioning and composure, and coach trust.",
    attributeGrowth: { positioning: 0.9, composure: 0.7 },
    statusEffects: { fatigue: 3, coachTrust: 4, mediaPressure: -2 },
  },
  BUILD_COACH_TRUST: {
    id: "BUILD_COACH_TRUST",
    label: "Build Coach Trust",
    description: "Impress the coaching staff. Less attribute growth.",
    statusEffects: { fatigue: 2, coachTrust: 9 },
    traitProgress: [{ traitId: "COACHS_FAVORITE", amount: 4 }],
  },
  BUILD_TEAM_CHEMISTRY: {
    id: "BUILD_TEAM_CHEMISTRY",
    label: "Build Team Chemistry",
    description: "Bond with teammates. Less attribute growth.",
    statusEffects: { fatigue: 2, teamChemistry: 9, morale: 3 },
    traitProgress: [{ traitId: "TEAM_PLAYER", amount: 4 }],
  },
  SOCIAL_MEDIA_PUSH: {
    id: "SOCIAL_MEDIA_PUSH",
    label: "Social Media Push",
    description: "Grow your profile — at the cost of focus.",
    statusEffects: { reputation: 8, mediaPressure: 8, coachTrust: -3 },
    traitProgress: [{ traitId: "MEDIA_DARLING", amount: 5 }],
  },
  EXTRA_PROFESSIONAL_ROUTINE: {
    id: "EXTRA_PROFESSIONAL_ROUTINE",
    label: "Extra Professional Routine",
    description: "Extra gym, diet and recovery work.",
    attributeGrowth: { professionalism: 1.2 },
    statusEffects: { fatigue: 4, injuryRisk: -4, morale: -4 },
    traitProgress: [{ traitId: "PROFESSIONAL", amount: 4 }],
  },
};

/** Choices available to this player (filters position-specific options). */
export function availableWeeklyChoices(career: Career): WeeklyChoiceDef[] {
  return Object.values(WEEKLY_CHOICES).filter((choice) => {
    if (!choice.positionFamilies || choice.positionFamilies.length === 0) return true;
    return choice.positionFamilies.includes(career.positionFamily);
  });
}

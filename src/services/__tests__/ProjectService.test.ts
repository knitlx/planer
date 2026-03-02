import { ProjectService } from "../ProjectService";

describe("ProjectService", () => {
  describe("calculateFocusScore", () => {
    it("calculates base score", () => {
      const score = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 50,
        daysSinceActive: 0,
      });
      expect(score).toBeGreaterThan(0);
    });

    it("adds bonus for progress >= 70%", () => {
      const score70 = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 70,
        daysSinceActive: 0,
      });
      const score69 = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 69,
        daysSinceActive: 0,
      });
      expect(score70).toBeGreaterThan(score69 + 20);
    });

    it("penalizes for stagnation", () => {
      const scoreStale = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 50,
        daysSinceActive: 5,
      });
      const scoreFresh = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 50,
        daysSinceActive: 0,
      });
      expect(scoreStale).toBeLessThan(scoreFresh);
    });

    it("never goes negative", () => {
      const score = ProjectService.calculateFocusScore({
        weight: 1,
        friction: 10,
        progress: 0,
        daysSinceActive: 100,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getDaysSinceActive", () => {
    it("calculates days correctly", () => {
      const result = ProjectService.getDaysSinceActive({
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
      expect(result).toBe(2);
    });
  });
});

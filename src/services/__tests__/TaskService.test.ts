import { TaskService } from "../TaskService";

describe("TaskService", () => {
  describe("generateMicroSteps", () => {
    it("generates steps for development tasks", () => {
      const result = TaskService["generateMicroSteps"]("Разработать API");
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("Создать файл");
    });

    it("generates steps for research tasks", () => {
      const result = TaskService["generateMicroSteps"](
        "Исследовать базу данных",
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("Открыть источник");
    });

    it("generates default steps for unknown patterns", () => {
      const result = TaskService["generateMicroSteps"]("Random task");
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("Просто открой файл");
    });
  });

  describe("calculateProjectProgress", () => {
    it("returns 0 for no tasks", async () => {
      const progress =
        await TaskService.calculateProjectProgress("non-existent");
      expect(progress).toBe(0);
    });
  });
});

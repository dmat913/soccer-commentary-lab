export type ExampleCategory =
  | "goal"
  | "shot"
  | "pass"
  | "save"
  | "dribble"
  | "defending"
  | "set-piece"
  | "general";

export type ExampleDifficulty = "easy" | "medium" | "hard";

export type ExampleItem = {
  id: string;
  text: string;
  category: ExampleCategory;
  difficulty: ExampleDifficulty;
  placement: ExamplePlacement;
};

export type ExamplePlacement = "chip" | "extended";

export type NgramCategory =
  | "th"
  | "ch"
  | "sh"
  | "wh"
  | "ph"
  | "ion"
  | "ent"
  | "ing"
  | "str"
  | "qu"
  | "ight"
  | "ough"
  | "able"
  | "ment";

export const ngramDictionary: Record<NgramCategory, string[]> = {
  th: ["the", "that", "this", "other", "there", "their", "something", "thought", "with", "further", "breathe", "theory"],
  ch: ["change", "school", "such", "reach", "match", "church", "chapter", "challenge", "search", "teacher", "kitchen"],
  sh: ["she", "should", "share", "fashion", "push", "finish", "shadow", "shape", "short", "nation", "publisher"],
  wh: ["when", "which", "where", "while", "white", "whole", "whisper", "whatever", "wheel", "whether"],
  ph: ["phone", "phrase", "phase", "graph", "sphere", "photo", "dolphin", "emphasis", "alphabet", "trophy"],
  ion: ["action", "section", "nation", "question", "option", "vision", "mission", "decision", "position", "motion"],
  ent: ["different", "student", "recent", "present", "event", "moment", "parent", "current", "patient", "silent"],
  ing: ["thing", "during", "morning", "building", "singing", "working", "feeling", "running", "learning", "thinking"],
  str: ["street", "strong", "structure", "strategy", "stream", "strike", "string", "struggle", "destroy", "stretch"],
  qu: ["quick", "quite", "question", "quality", "quarter", "quiet", "equally", "require", "square", "quote"],
  ight: ["night", "right", "light", "might", "thought", "flight", "height", "bright", "slight", "sight"],
  ough: ["through", "thought", "enough", "although", "tough", "rough", "bought", "brought", "drought"],
  able: ["table", "capable", "available", "enable", "probable", "variable", "durable", "readable", "stable"],
  ment: ["government", "movement", "development", "payment", "statement", "element", "environment", "judgment"],
};

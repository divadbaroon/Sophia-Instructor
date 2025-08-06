import { Session } from "@/types";

export const sessionConfigs: Omit<Session, "simulationResult" | "status">[] = [
  {
    id: "1",
    studentName: "Simulated Student 1", 
    subject: "Binary Tree Traversal",
    difficulty: "intermediate",
    description: "A computer science student who understands theory but struggles to visualize traversal algorithms in practice."
  },
  {
    id: "2", 
    studentName: "Simulated Student 2",
    subject: "Binary Search Trees", 
    difficulty: "advanced",
    description: "An advanced programming student seeking deeper understanding of BST operations and time complexity."
  },
  {
    id: "3",
    studentName: "Simulated Student 3",
    subject: "Tree Balancing",
    difficulty: "beginner",
    description: "A new programming student who needs clear, simple explanations with examples to grasp tree concepts."
  }
];
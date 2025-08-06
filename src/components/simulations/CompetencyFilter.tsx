import { Button } from "@/components/ui/button";

interface CompetencyFilterProps {
  competencyFilter: "all" | "beginner" | "intermediate" | "advanced";
  setCompetencyFilter: (filter: "all" | "beginner" | "intermediate" | "advanced") => void;
}

export function CompetencyFilter({ competencyFilter, setCompetencyFilter }: CompetencyFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 py-3 border-b border-gray-200 -mt-5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700">Student Competency:</span>
        <div className="flex gap-1">
          <Button
            variant={competencyFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompetencyFilter("all")}
            className="h-6 px-2 text-xs"
          >
            All
          </Button>
          <Button
            variant={competencyFilter === "beginner" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompetencyFilter("beginner")}
            className="h-6 px-2 text-xs"
          >
            Beginner
          </Button>
          <Button
            variant={competencyFilter === "intermediate" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompetencyFilter("intermediate")}
            className="h-6 px-2 text-xs"
          >
            Intermediate
          </Button>
          <Button
            variant={competencyFilter === "advanced" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompetencyFilter("advanced")}
            className="h-6 px-2 text-xs"
          >
            Advanced
          </Button>
        </div>
      </div>
    </div>
  );
}
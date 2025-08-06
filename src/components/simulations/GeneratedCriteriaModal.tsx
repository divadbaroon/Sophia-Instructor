import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check } from "lucide-react";
import { EvaluationCriterion } from "@/components/simulations/EvaluationCriteriaModal";

interface GeneratedCriteriaModalProps {
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
 generatedCriteria: EvaluationCriterion[];
 onAcceptCriteria: (selectedCriteria: EvaluationCriterion[]) => void;
}

export function GeneratedCriteriaModal({
 isOpen,
 onOpenChange,
 generatedCriteria,
 onAcceptCriteria
}: GeneratedCriteriaModalProps) {
 const [selectedCriteria, setSelectedCriteria] = useState<Set<string>>(new Set());

 useEffect(() => {
   if (generatedCriteria && generatedCriteria.length > 0) {
     setSelectedCriteria(new Set(generatedCriteria.map(c => c.id)));
   }
 }, [generatedCriteria]);

 const handleToggleCriterion = (criterionId: string) => {
   setSelectedCriteria(prev => {
     const newSet = new Set(prev);
     if (newSet.has(criterionId)) {
       newSet.delete(criterionId);
     } else {
       newSet.add(criterionId);
     }
     return newSet;
   });
 };

 const handleSelectAll = () => {
   setSelectedCriteria(new Set(generatedCriteria.map(c => c.id)));
 };

 const handleSelectNone = () => {
   setSelectedCriteria(new Set());
 };

 const handleAccept = () => {
   const selectedCriteriaList = generatedCriteria.filter(c => selectedCriteria.has(c.id));
   onAcceptCriteria(selectedCriteriaList);
   onOpenChange(false);
 };

 const handleDecline = () => {
   onOpenChange(false);
 };

 return (
   <Dialog open={isOpen} onOpenChange={onOpenChange}>
     <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
       <DialogHeader>
         <DialogTitle className="flex items-center gap-2">
           Generated Evaluation Criteria
         </DialogTitle>
       </DialogHeader>

       <div className="space-y-4">
         

         {/* Selection Controls */}
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Button
               onClick={handleSelectAll}
               variant="outline"
               size="sm"
               className="text-xs"
             >
               Select All
             </Button>
             <Button
               onClick={handleSelectNone}
               variant="outline"
               size="sm"
               className="text-xs"
             >
               Select None
             </Button>
           </div>
           <div className="text-sm text-gray-600">
             {selectedCriteria.size} of {generatedCriteria?.length || 0} selected
           </div>
         </div>

         {/* Criteria List */}
         <div className="overflow-y-auto max-h-[50vh] space-y-3">
           {generatedCriteria?.map((criterion) => {
             const isSelected = selectedCriteria.has(criterion.id);
             
             return (
               <div
                 key={criterion.id}
                 className={`border rounded-lg p-4 cursor-pointer transition-all ${
                   isSelected 
                     ? 'border-blue-300 bg-blue-50' 
                     : 'border-gray-200 bg-white hover:border-gray-300'
                 }`}
                 onClick={() => handleToggleCriterion(criterion.id)}
               >
                 <div className="flex items-start justify-between mb-3">
                   <div className="flex items-center gap-3">
                     <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                       isSelected 
                         ? 'bg-blue-600 border-blue-600' 
                         : 'border-gray-300'
                     }`}>
                       {isSelected && <Check className="w-3 h-3 text-white" />}
                     </div>
                     <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                   </div>
                 </div>

                 <div className="ml-8">
                   <p className="text-sm text-gray-600 leading-relaxed">
                     {criterion.conversationGoalPrompt}
                   </p>
                 </div>
               </div>
             );
           })}
         </div>

         {(generatedCriteria?.length || 0) === 0 && (
           <div className="text-center py-8 text-gray-500">
             <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
             <p>No criteria were generated.</p>
             <p className="text-sm">Try updating your agent prompt and generating again.</p>
           </div>
         )}
       </div>

       {/* Action Buttons */}
       <div className="flex justify-between items-center pt-4 border-t border-gray-200">
         <div className="text-sm text-gray-500">
           These criteria will be saved and used for future simulations
         </div>
         <div className="flex gap-2">
           <Button onClick={handleDecline} variant="outline">
             Cancel
           </Button>
           <Button 
             onClick={handleAccept}
             disabled={selectedCriteria.size === 0}
             className="flex items-center gap-2"
           >
             <Check className="w-4 h-4" />
             Use Selected ({selectedCriteria.size})
           </Button>
         </div>
       </div>
     </DialogContent>
   </Dialog>
 );
}
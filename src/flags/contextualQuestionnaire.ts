import { growthbookAdapter } from "@flags-sdk/growthbook";
import { flag } from "flags/next";
import { identify } from "./payment"; // Reutilizar identify

export const contextualQuestionnaireFlag = flag<string>({
  key: "contextual_questionnaire_enabled",
  adapter: growthbookAdapter.feature<string>(),
  defaultValue: "disabled",
  identify,
});

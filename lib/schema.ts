// Maps raw xlsx column headers to sanitized SQLite column names
export const COLUMN_MAP: Record<string, string> = {
  resp_id: "resp_id",
  unique_identifier: "unique_identifier",
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  secondary_email: "secondary_email",
  support_code: "support_code",
  survey_link: "survey_link",
  passcode: "passcode",
  language: "language",
  date_completed: "date_completed",
  is_excluded: "is_excluded",
  survey_status: "survey_status",
  "hierarchy:1": "hierarchy_1",
  "hierarchy:2": "hierarchy_2",
  D_AGE_GROUP: "age_group",
  Career_Development: "career_development",
  COE_Code: "coe_code",
  Department_County: "department_county",
  FLSA_Exempt: "flsa_exempt",
  Gender: "gender",
  Job_Title: "job_title",
  Life: "life",
  Remote_Worker: "remote_worker",
  Engagement_Index: "engagement_index",
  Ethnicity: "ethnicity",
  D_TENURE_GROUP: "tenure_group",
  Term_After_Survey: "term_after_survey",
  Term_Dates: "term_dates",
};

// Add item columns
for (let i = 1; i <= 60; i++) {
  if (i === 11 || i === 18 || i === 27) continue;
  COLUMN_MAP[`item:${i}`] = `item_${i}`;
}
COLUMN_MAP["item:61"] = "item_61";
COLUMN_MAP["item:61_themes"] = "item_61_themes";
COLUMN_MAP["item:62"] = "item_62";
COLUMN_MAP["item:62_themes"] = "item_62_themes";
COLUMN_MAP["index:2_Engagement"] = "index_engagement";
COLUMN_MAP["index:3_Intent to Stay"] = "index_intent_to_stay";

// Column types for CREATE TABLE
function getColumnType(col: string): string {
  if (col === "resp_id" || col === "hierarchy_1" || col === "hierarchy_2")
    return "INTEGER";
  if (/^item_\d+$/.test(col) && !["item_61", "item_62"].includes(col))
    return "INTEGER";
  return "TEXT";
}

const sanitizedColumns = Object.values(COLUMN_MAP);

export const SCHEMA_DDL = `CREATE TABLE survey_responses (\n${sanitizedColumns
  .map((col) => `  ${col} ${getColumnType(col)}`)
  .join(",\n")}\n);`;

// Human-readable schema description for Claude's system prompt
export const SCHEMA_DESCRIPTION = `Table: survey_responses (${sanitizedColumns.length} columns, ~1300 rows)

Demographic / metadata columns:
- resp_id (INTEGER): respondent ID
- unique_identifier (TEXT): employee ID
- first_name, last_name, email, secondary_email (TEXT): PII fields
- survey_link, passcode, support_code (TEXT): survey administration
- language (TEXT): survey language
- date_completed (TEXT): timestamp when survey was completed (format: YYYY-MM-DD HH:MM:SS)
- is_excluded (TEXT): 'yes' or 'no'
- survey_status (TEXT): 'complete', 'not started', 'partial'
- hierarchy_1, hierarchy_2 (INTEGER): organizational hierarchy codes
- age_group (TEXT): e.g. '25-29 years', '30-39 years', '40-49 years', '50-59 years', '60+ years', 'Under 25 years'
- career_development (TEXT): 'Yes' or 'No'
- coe_code (TEXT): center of excellence code, e.g. 'IDD', 'BUS', 'MHS'
- department_county (TEXT): county name, e.g. 'Lancaster', 'York', 'Union'
- flsa_exempt (TEXT): 'Yes' or 'No'
- gender (TEXT): 'Male', 'Female', etc.
- job_title (TEXT): employee job title
- life (TEXT): 'Yes' or 'No'
- remote_worker (TEXT): 'CSG Location', 'Remote', 'Hybrid'
- engagement_index (TEXT): 'Key Contributor', 'Opportunity Group', etc.
- ethnicity (TEXT): e.g. 'White', 'Black or African American', 'Hispanic or Latino', 'Two or More Races', 'Asian'
- tenure_group (TEXT): e.g. '1-2 years', '3-5 years', '6-10 years', '11+ years', 'Less than 1 year'
- term_after_survey (TEXT): 'Not Terminated', 'Terminated'
- term_dates (TEXT): termination date or 'Not Terminated'

Survey item columns (INTEGER, Likert scale 1-6 where higher = more favorable):
- item_1 through item_60 (skipping item_11, item_18, item_27 which do not exist)
- These map to specific survey questions (see item mapping below)

Open-ended response columns (TEXT):
- item_61: open-ended text response to question 61
- item_61_themes: coded theme(s) for item_61 response
- item_62: open-ended text response to question 62
- item_62_themes: coded theme(s) for item_62 response

Index columns (TEXT):
- index_engagement: engagement classification, e.g. 'Key Contributor', 'Undecided'
- index_intent_to_stay: intent to stay classification, e.g. 'Content', 'Undecided', 'Flight Risk'`;

# Contribution Workflow

Follow these rules before making any changes:

1. **Establish the Spec First**
   - Before any coding or modifications, confirm which specification will be worked on.
   - Ask the user to choose or approve the spec focus prior to starting.

2. **Create a Matching Branch**
   - Once the target spec is approved, create a new git branch named after the spec.
   - Do not work from `main`; every task begins on its own branch.

3. **Create Spec Directory Structure**
   - Every spec must have its own directory: `specs/XXX-spec-name/`
   - Required files in spec directory:
     - `README.md`: Complete specification document (in English)
     - `CHECKLIST.md`: User-facing verification checklist (externally testable items only)
   - Do not pre-check checklist items; leave them unchecked for manual verification.
   - CHECKLIST.md guidelines:
     - Focus on end-to-end user behavior, not API endpoints or internal implementation details
     - Include only items that can be easily verified through manual testing
     - Avoid excessive error handling scenarios and edge cases that are difficult to test manually
     - Keep the checklist practical and user-centric

4. **Validate Spec Quality Continuously**
   - During implementation, regularly confirm with the user whether the spec needs refinement.
   - If the spec scope or directory changes, rename the working branch to stay aligned.

5. **Commit Finalized Specs**
   - After the user confirms the spec is complete, commit the current spec state before proceeding with implementation work.

Adhering to this workflow keeps collaboration clear and ensures specs drive every change.

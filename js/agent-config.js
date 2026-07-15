/* ============================================================
   {{SITE_NAME}} — Voice agent configuration (Vapi)
   ------------------------------------------------------------
   "Ramon" is one shared Vapi assistant reused across every site
   this template builds — same public key + assistant ID on
   every prospect. Only the on-page copy (tagline/bubble) is
   tokenized so it reads naturally on each realtor's site.
   ============================================================ */

window.HR_AGENT_CONFIG = {
  vapiPublicKey: "6eb62d52-cfac-4e98-bc6a-88e25c7291ce",   // public share key (client-safe)
  vapiAssistantId: "7924e3f2-2b92-4e5e-aca2-fcf9901e6a32",

  agentName: "Ramon",
  tagline: "{{AGENT_TAGLINE}}",
  bubbleText: "{{AGENT_BUBBLE_TEXT}}"
};

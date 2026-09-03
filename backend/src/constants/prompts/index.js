/**
 * Central Prompts Registry
 */

const { buildRootCausePrompt } = require("./rootCausePrompts");
const { buildCampaignPrompt } = require("./campaignPrompts");

module.exports = {
  buildRootCausePrompt,
  buildCampaignPrompt,
};

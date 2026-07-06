import { sendEnquiryProcessingEmail } from "./enquiryProcessing.template.js";
import { sendEnquiryReceivedEmail } from "./enquiryReceived.template.js";
import { sendExclusivityEmail } from "./exclusivity.template.js";
import { sendMatchExpiredEmail } from "./matchExpired.template.js";
import { sendPostEventFeedbackEmail } from "./postEventFeedback.template.js";
import { sendProBonoEmail } from "./proBono.template.js";
import { sendReengagementEmail } from "./reengagement.template.js";
import { sendNoAvailabilityEmail } from "./noAvailability.template.js";

export const mailer = {
  SEND_ENQUIRY_PROCESSING: sendEnquiryProcessingEmail,
  SEND_ENQUIRY_RECEIVED: sendEnquiryReceivedEmail,
  SEND_EXCLUSIVITY: sendExclusivityEmail,
  SEND_MATCH_EXPIRED: sendMatchExpiredEmail,
  SEND_POST_EVENT_FEEDBACK: sendPostEventFeedbackEmail,
  SEND_PRO_BONO: sendProBonoEmail,
  SEND_REENGAGEMENT: sendReengagementEmail,
  SEND_NO_AVAILABILITY: sendNoAvailabilityEmail,
}

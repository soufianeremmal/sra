import { IRequest, RequestStatus } from '../requests/models/request.model';
import { IUser } from '../auth/model';
import { postMessage } from '../../integrations/slack.client';
import { sendEmail } from '../../integrations/gmail.client';

/**
 * Notify the requester that their request's status changed.
 * Fire-and-forget: never blocks the status update itself.
 */
export function notifyStatusChanged(input: {
  request: IRequest;
  requester: IUser;
  previousStatus: RequestStatus;
  comment: string;
}): void {
  const { request, requester, previousStatus, comment } = input;
  const baseUrl = process.env.SRA_BASE_URL || 'http://localhost:3000';
  const sraUrl = `${baseUrl}/requests/${request._id.toString()}`;

  // Slack DM-style — sent to the sampling channel with the requester tagged.
  // In real Slack, we'd DM the requester directly using their email → Slack user lookup.
  const slackText = `📌 Statut mis à jour pour *${request.projectName}*
${previousStatus} → *${request.status}*
_"${comment}"_
<${sraUrl}|Voir la demande>`;

  const channel = process.env.SLACK_SAMPLING_CHANNEL || '#sampling-team';

  postMessage({ channel, text: slackText }).catch((err) => {
    console.error('[notify] Slack failed:', err.message);
  });

  // Direct email to the requester
  const gmailSubject = `[SRA] ${request.projectName} : ${request.status}`;
  const gmailBody = `Bonjour ${requester.name},

Le statut de votre demande "${request.projectName}" a été mis à jour.

Nouveau statut : ${request.status}
Statut précédent : ${previousStatus}
Commentaire : ${comment}

Voir la demande : ${sraUrl}

L'équipe Sampling`;

  sendEmail({ to: requester.email, subject: gmailSubject, body: gmailBody }).catch((err) => {
    console.error('[notify] Gmail failed:', err.message);
  });
}
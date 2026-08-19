import { IRequest } from '../requests/models/request.model';
import { IUser } from '../auth/model';
import { postMessage } from '../../integrations/slack.client';
import { sendEmail } from '../../integrations/gmail.client';
import { createNotionPageForRequest } from '../../integrations/notion.client';

/**
 * Fire-and-forget: notify all channels that a new request was submitted.
 * Each channel is called independently; a failure in one doesn't block the others.
 * The caller (the request submission flow) never awaits this — it's kicked off in background.
 */
export function notifyRequestSubmitted(input: {
  request: IRequest;
  requester: IUser;
}): void {
  const { request, requester } = input;
  const channel = process.env.SLACK_SAMPLING_CHANNEL || '#sampling-team';
  const gmailTo = process.env.GMAIL_SAMPLING_ADDRESS || 'sampling@fifteen.eu';
  const baseUrl = process.env.SRA_BASE_URL || 'http://localhost:3000';
  const sraUrl = `${baseUrl}/requests/${request._id.toString()}`;

  const bikeCount = request.bikes?.length || 0;
  const deliveryDate = request.logistics?.deliveryLatestDate
    ? new Date(request.logistics.deliveryLatestDate).toLocaleDateString('fr-FR')
    : 'à confirmer';

  // Slack
  const slackText = `🆕 Nouvelle demande de sampling
*${request.projectName}* (${request.projectType}) — ${requester.name}
${bikeCount} vélo(s) — livraison à ${request.city} pour le ${deliveryDate}
<${sraUrl}|Voir dans SRA>`;

  postMessage({ channel, text: slackText }).catch((err) => {
    console.error('[notify] Slack failed:', err.message);
  });

  // Gmail
  const gmailSubject = `[SRA] Nouvelle demande : ${request.projectName}`;
  const gmailBody = `Une nouvelle demande de sampling a été soumise.

Projet : ${request.projectName}
Type : ${request.projectType}
Ville : ${request.city}
Demandeur : ${requester.name} (${requester.email})
Nombre de vélos : ${bikeCount}
Date de livraison souhaitée : ${deliveryDate}

Voir dans SRA : ${sraUrl}`;

  sendEmail({ to: gmailTo, subject: gmailSubject, body: gmailBody }).catch((err) => {
    console.error('[notify] Gmail failed:', err.message);
  });

  // Notion
  createNotionPageForRequest({
    requestId: request._id.toString(),
    projectName: request.projectName,
    city: request.city,
    projectType: request.projectType,
    requesterName: requester.name,
    status: request.status,
    createdAt: request.createdAt,
    sraUrl,
  }).catch((err) => {
    console.error('[notify] Notion failed:', err.message);
  });
}
import { IRequest } from '../requests/models/request.model';
import { IUser } from '../auth/model';

export interface GeneratedEmail {
  subject: string;
  body: string;
}

/**
 * Produces a copy-paste-ready email that Marketing can send to a client
 * about a specific request. Not sent — just returned as text.
 */
export function generateClientEmailForRequest(input: {
  request: IRequest;
  requester: IUser;
}): GeneratedEmail {
  const { request, requester } = input;

  const subject = `[Fifteen] ${request.projectName} — Sampling coordination`;

  const bikeCount = request.bikes?.length || 0;
  const deliveryDate = request.logistics?.deliveryLatestDate
    ? new Date(request.logistics.deliveryLatestDate).toLocaleDateString('fr-FR')
    : 'à confirmer';

  const body = `Bonjour,

Je reviens vers vous concernant votre demande de sampling.

Détails de la demande :
- Projet : ${request.projectName}
- Type : ${request.projectType}
- Ville : ${request.city}
- Nombre de vélos demandés : ${bikeCount}
- Date de livraison souhaitée : ${deliveryDate}

Je reste disponible pour toute question.

Cordialement,
${requester.name}
Fifteen`;

  return { subject, body };
}
/**
 * Generates a Google Apps Script that forwards form submissions to the
 * given webhook URL, for use with a form's "On form submit" trigger.
 *
 * Responses are keyed by question title. When multiple questions share the
 * same title a numeric suffix is appended (e.g. "Rating", "Rating_2",
 * "Rating_3") so no answer is silently overwritten.
 *
 * @param webhookUrl - Endpoint that receives the submission payload.
 * @returns Apps Script source as a string.
 */
export const generateGoogleFormScript = (
  webhookUrl: string
) => `function onFormSubmit(e) {
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  var responses = {};
  var titleCount = {};
  for (var i = 0; i < itemResponses.length; i++) {
    var itemResponse = itemResponses[i];
    var title = itemResponse.getItem().getTitle();

    if (titleCount[title] === undefined) {
      titleCount[title] = 1;
      responses[title] = itemResponse.getResponse();
    } else {
      titleCount[title]++;
      responses[title + '_' + titleCount[title]] = itemResponse.getResponse();
    }
  }

  var payload = {
    formId: e.source.getId(),
    formTitle: e.source.getTitle(),
    responseId: formResponse.getId(),
    timestamp: formResponse.getTimestamp(),
    respondentEmail: formResponse.getRespondentEmail(),
    responses: responses
  };

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  var WEBHOOK_URL = '${webhookUrl}';

  try {
    UrlFetchApp.fetch(WEBHOOK_URL, options);
  } catch(error) {
    console.error('Webhook failed:', error);
  }
}`

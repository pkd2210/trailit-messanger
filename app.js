import { App, LogLevel } from '@slack/bolt';
import { config } from 'dotenv';
import express from 'express';
import { registerListeners } from './listeners/index.js';

const app = express();
app.use(express.json());

config();

/** Initialization */
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

/** Register Listeners */
registerListeners(slackApp);

/** Start the Bolt App */
(async () => {
  try {
    await slackApp.start();
    slackApp.logger.info('⚡️ Bolt app is running!');
  } catch (error) {
    slackApp.logger.error('Failed to start the app', error);
  }
})();
/**START APP */
app.post('/sendmessage', async (_req, res) => {
  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server is missing API_KEY configuration' });
    }

    const authHeader = _req.headers.authorization;

    if (authHeader !== apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { userId, category, message } = _req.body ?? {};

    if (!userId || !category || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId, category, message',
      });
    }

    await slackApp.client.chat.postMessage({
      channel: userId,
      text: `New message in category ${category}: ${message}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'New Message From TrailIt',
            emoji: true,
          },
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: category,
            emoji: true,
          },
        },
        {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: message,
                },
              ],
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Shop',
                emoji: true,
              },
              value: 'open_shop',
              url: 'https://trailit.hackclub.com/shop',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'FAQ',
                emoji: true,
              },
              value: 'open_faq',
              url: 'https://trailit.hackclub.com/faq',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Submit',
                emoji: true,
              },
              value: 'open_submit',
              url: 'https://trailit.hackclub.com/submit/product',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'image',
              image_url: 'https://avatars.slack-edge.com/2025-10-10/9661249810775_dc9547e59052a3bf013f_512.png',
              alt_text: 'peleg logo',
            },
            {
              type: 'mrkdwn',
              text: 'For every problam, fell free to contact me *@peleg2210*',
            },
          ],
        },
      ],
    });

    return res.status(200).json({ ok: true, message: 'Message sent to Slack!' });
  } catch (error) {
    console.error('Failed to send message to Slack', error);
    return res.status(500).json({ error: 'Failed to send message to Slack' });
  }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});

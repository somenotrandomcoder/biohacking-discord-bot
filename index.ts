import { Client, GatewayIntentBits } from 'discord.js';
import * as admin from 'firebase-admin';

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.YOUR_BOT_TOKEN;

// Feedback form link
const feedbackFormLink = "https://wp.pl/";

interface HarmfulSubstance {
  name: string;
  shortSummary: string;
  wikiLink: string;
}

let harmfulSubstances: HarmfulSubstance[] = [];

const updateHarmfulSubstances = async () => {
  const snapshot = await db.collection('harmfulSubstances').get();
  harmfulSubstances = snapshot.docs.map((doc) => doc.data() as HarmfulSubstance);
};

// Listen for changes in Firestore collection
db.collection('harmfulSubstances').onSnapshot(() => {
  updateHarmfulSubstances();
});

client.once('ready', () => {
  console.log('Bot is ready');
  // Initial data fetch
  updateHarmfulSubstances();
});

client.on('messageCreate', (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  let compiledMessage = '';
  
  for (const substance of harmfulSubstances) {
    if (message.content.includes(substance.name)) {
      compiledMessage += `⚠️ **${substance.name}**: ${substance.shortSummary}\nRead more: [${substance.name}](${substance.wikiLink})\n`;
    }
  }

  if (compiledMessage) {
    compiledMessage += `Feedback: [submit suggestion](${feedbackFormLink})`;
    message.channel.send(compiledMessage);
  }
});

// Login the bot
client.login(token);

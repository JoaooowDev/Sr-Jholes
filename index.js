require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const QuickDB = require('quick.db');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');

const { REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User]
});

client.commands = new Collection();

// Carregar comandos
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Função para registrar, atualizar e deletar comandos
async function syncCommands() {
  const commands = [];
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    // Deletar comandos globais
    const appCmds = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    for (const cmd of appCmds) {
      await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, cmd.id));
    }
    // Registrar comandos na guild
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, config.guildId),
      { body: commands }
    );
    console.log('Comandos sincronizados com sucesso!');
  } catch (error) {
    console.error('Erro ao sincronizar comandos:', error);
  }
}

// Carregar handlers
const handlerFiles = fs.readdirSync(path.join(__dirname, 'handlers')).filter(file => file.endsWith('.js'));
for (const file of handlerFiles) {
  require(`./handlers/${file}`)(client);
}

syncCommands().then(() => client.login(process.env.TOKEN));

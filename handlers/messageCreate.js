const { Events } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const config = require('../config.json');

module.exports = (client) => {
  client.on(Events.MessageCreate, async message => {
    // Ignorar mensagens de bots
    if (message.author.bot) return;

    // Verificar se o bot foi mencionado
    if (message.mentions.has(client.user)) {
      // Verificar se está no canal correto
      if (message.channel.id !== config.canalIA) {
        const canalIA = message.guild.channels.cache.get(config.canalIA);
        return message.reply(`Parceiro, use minha IA no canal ${canalIA}!`);
      }

      // Remover a menção do bot da pergunta
      const pergunta = message.content.replace(/<@!?[0-9]+>/g, '').trim();
      
      if (!pergunta) return;

      await message.channel.sendTyping();
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `Você é um cowboy do Red Dead Redemption. Responda sempre como um personagem do velho oeste, focando em mecânicas e roleplay. Use gírias do velho oeste e seja bem caracterizado.\n\nPergunta do usuário: ${pergunta}`;
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            thinkingConfig: {
              thinkingBudget: 0,
            },
          }
        });

        const resposta = response.text;
        
        // Dividir a resposta em partes se for maior que 1900 caracteres (deixando margem para formatação)
        const partes = resposta.match(/[\s\S]{1,1900}/g) || [resposta];
        
        // Enviar cada parte como uma mensagem separada
        for (const parte of partes) {
          await message.reply(parte);
        }
      } catch (err) {
        console.error('Erro Gemini:', err);
        await message.reply('Desculpe parceiro, tive um problema pra entender sua pergunta.');
      }
    }
  });
};

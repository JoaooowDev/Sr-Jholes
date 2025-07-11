const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perguntar')
    .setDescription('Faz uma pergunta para o cowboy')
    .addStringOption(option =>
      option
        .setName('pergunta')
        .setDescription('A pergunta que você quer fazer')
        .setRequired(true)),

  async execute(interaction) {
    // Verificar se está no canal correto
    if (interaction.channelId !== config.canalIA) {
      const canalIA = interaction.guild.channels.cache.get(config.canalIA);
      return interaction.reply({ 
        content: `Parceiro, use minha IA no canal ${canalIA}!`,
        ephemeral: true 
      });
    }

    await interaction.deferReply();
    
    try {
      const pergunta = interaction.options.getString('pergunta');
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
      
      // Dividir a resposta em partes se for maior que 1900 caracteres
      const partes = resposta.match(/[\s\S]{1,1900}/g) || [resposta];
      
      // Enviar a primeira parte como reply
      await interaction.editReply(partes[0]);
      
      // Se houver mais partes, enviar como mensagens de seguimento
      if (partes.length > 1) {
        for (let i = 1; i < partes.length; i++) {
          await interaction.followUp(partes[i]);
        }
      }
    } catch (err) {
      console.error('Erro Gemini:', err);
      await interaction.editReply('Desculpe parceiro, tive um problema pra entender sua pergunta.');
    }
  },
};
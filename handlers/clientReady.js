const { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = (client) => {
  client.on(Events.ClientReady, async () => {
    console.log(`Bot iniciado como ${client.user.tag}`);
    // Registro
    const canalRegistro = client.channels.cache.get(config.canalRegistro);
    if (canalRegistro) {
      const mensagens = await canalRegistro.messages.fetch({ limit: 10 });
      const jaTem = mensagens.some(m => m.author.id === client.user.id && m.embeds.length);
      if (!jaTem) {
        const embed = new EmbedBuilder()
          .setTitle('Registro de Personagem')
          .setDescription('Clique no botão abaixo para se registrar e receber acesso ao servidor.')
          .setColor('Yellow');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('registrar').setLabel('Registrar').setStyle(1)
        );
        await canalRegistro.send({ embeds: [embed], components: [row] });
      }
    }
    // Baú
    const canalBau = client.channels.cache.get(config.canalBau);
    if (canalBau) {
      const mensagens = await canalBau.messages.fetch({ limit: 10 });
      const jaTem = mensagens.some(m => m.author.id === client.user.id && m.embeds.length);
      if (!jaTem) {
        const embed = new EmbedBuilder()
          .setTitle('Baú Comunitário')
          .setDescription('Use os botões abaixo para retirar ou colocar itens no baú.')
          .setColor('Blue');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('retirar_item').setLabel('Retirar Itens').setStyle(2),
          new ButtonBuilder().setCustomId('colocar_item').setLabel('Colocar Itens').setStyle(3)
        );
        await canalBau.send({ embeds: [embed], components: [row] });
      }
    }
    // Pedidos
    const canalPedidos = client.channels.cache.get(config.canalPedidos);
    if (canalPedidos) {
      const mensagens = await canalPedidos.messages.fetch({ limit: 10 });
      const jaTem = mensagens.some(m => m.author.id === client.user.id && m.embeds.length);
      if (!jaTem) {
        const embed = new EmbedBuilder()
          .setTitle('Pedidos de Encomenda')
          .setDescription('Clique em "Novo Pedido" para registrar uma encomenda.')
          .setColor('Red');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('novo_pedido').setLabel('Novo Pedido').setStyle(1)
        );
        await canalPedidos.send({ embeds: [embed], components: [row] });
      }
    }
  });
};

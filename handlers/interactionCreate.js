const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config.json');

// Função auxiliar para verificar se é staff
const isStaff = (member) => {
  if (!config.cargoStaff || !Array.isArray(config.cargoStaff)) return false;
  return config.cargoStaff.some(cargoId => member.roles.cache.has(cargoId));
};

module.exports = (client) => {
  client.on(Events.InteractionCreate, async interaction => {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Ocorreu um erro ao executar o comando.', ephemeral: true });
      }
      return;
    }

    // Botão de registro
    if (interaction.isButton() && interaction.customId === 'registrar') {
      const modal = new ModalBuilder()
        .setCustomId('modal_registro')
        .setTitle('Registro de Personagem');
      const nome = new TextInputBuilder()
        .setCustomId('nome_personagem')
        .setLabel('Nome do personagem')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const pombo = new TextInputBuilder()
        .setCustomId('pombo')
        .setLabel('Pombo')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const id = new TextInputBuilder()
        .setCustomId('id')
        .setLabel('ID')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(nome),
        new ActionRowBuilder().addComponents(pombo),
        new ActionRowBuilder().addComponents(id)
      );
      await interaction.showModal(modal);
      return;
    }

    // Botão de baú
    if (interaction.isButton() && (interaction.customId === 'retirar_item' || interaction.customId === 'colocar_item')) {
      const modal = new ModalBuilder()
        .setCustomId(`modal_bau_${interaction.customId}`)
        .setTitle(interaction.customId === 'retirar_item' ? 'Retirar Itens do Baú' : 'Colocar Itens no Baú');
      const itens = new TextInputBuilder()
        .setCustomId('itens')
        .setLabel('Itens')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(itens));
      await interaction.showModal(modal);
      return;
    }

    // Botão de novo pedido
    if (interaction.isButton() && interaction.customId === 'novo_pedido') {
      const modal = new ModalBuilder()
        .setCustomId('modal_pedido')
        .setTitle('Novo Pedido');
      const nome = new TextInputBuilder()
        .setCustomId('nome_cliente')
        .setLabel('Nome do cliente')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const pombo = new TextInputBuilder()
        .setCustomId('pombo')
        .setLabel('Pombo')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const encomenda = new TextInputBuilder()
        .setCustomId('encomenda')
        .setLabel('Encomenda')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
      const valor = new TextInputBuilder()
        .setCustomId('valor')
        .setLabel('Valor total/pagamento')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(nome),
        new ActionRowBuilder().addComponents(pombo),
        new ActionRowBuilder().addComponents(encomenda),
        new ActionRowBuilder().addComponents(valor)
      );
      await interaction.showModal(modal);
      return;
    }

    // Submissão de modal de registro
    if (interaction.isModalSubmit() && interaction.customId === 'modal_registro') {
      const nome = interaction.fields.getTextInputValue('nome_personagem');
      const pombo = interaction.fields.getTextInputValue('pombo');
      const id = interaction.fields.getTextInputValue('id');
      const serverIcon = interaction.guild.iconURL({ dynamic: true });

      // Criar embed temporário com os dados do registro
      const tempEmbed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle('📝 Selecione seu Cargo')
        .setDescription('Por favor, selecione o cargo que você deseja receber:')
        .addFields(
          { name: 'Nome do personagem', value: nome, inline: true },
          { name: 'Pombo', value: pombo, inline: true },
          { name: 'ID', value: id, inline: true }
        )
        .setThumbnail(serverIcon)
        .setTimestamp();

      // Criar menu de seleção de cargo
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_cargo_${interaction.user.id}`)
        .setPlaceholder('Escolha seu cargo')
        .setMinValues(1)
        .setMaxValues(1);

      // Adicionar opções do config.json
      if (config.cargosDisponiveis && Array.isArray(config.cargosDisponiveis)) {
        config.cargosDisponiveis.forEach(cargo => {
          selectMenu.addOptions({
            label: cargo.nome,
            description: cargo.descricao || 'Clique para selecionar este cargo',
            value: cargo.id
          });
        });
      }

      const row = new ActionRowBuilder().addComponents(selectMenu);

      // Enviar mensagem com o menu de seleção
      await interaction.reply({
        embeds: [tempEmbed],
        components: [row],
        ephemeral: true
      });
      return;
    }

    // Handler para seleção de cargo
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('select_cargo_')) {
      const cargoSelecionadoId = interaction.values[0];
      const userId = interaction.user.id;
      const serverIcon = interaction.guild.iconURL({ dynamic: true });
      const canalLogs = client.channels.cache.get(config.canalLogsRegistro);

      if (canalLogs) {
        // Recuperar informações do registro do embed anterior
        const oldEmbed = interaction.message.embeds[0];
        const nome = oldEmbed.fields.find(f => f.name === 'Nome do personagem')?.value;
        const pombo = oldEmbed.fields.find(f => f.name === 'Pombo')?.value;
        const id = oldEmbed.fields.find(f => f.name === 'ID')?.value;

        // Encontrar o nome do cargo selecionado
        const cargoSelecionado = config.cargosDisponiveis.find(c => c.id === cargoSelecionadoId);
        const cargoNome = cargoSelecionado ? cargoSelecionado.nome : 'Cargo não encontrado';

        const logEmbed = new EmbedBuilder()
          .setColor(0xFFFF00)
          .setTitle('📝 Novo Registro de Personagem')
          .setThumbnail(serverIcon)
          .addFields(
            { name: 'Usuário', value: `<@${userId}>`, inline: true },
            { name: 'Nome do personagem', value: nome, inline: true },
            { name: 'Pombo', value: pombo, inline: true },
            { name: 'ID', value: id, inline: true },
            { name: 'Cargo Solicitado', value: cargoNome, inline: true }
          )
          .setTimestamp();

        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`aprovar_registro_${userId}_${cargoSelecionadoId}`)
            .setLabel('Aprovar')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`recusar_registro_${userId}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger)
        );

        await canalLogs.send({ embeds: [logEmbed], components: [buttonRow] });

        const replyEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('📝 Registro Enviado')
          .setDescription(`Seu registro foi enviado para análise!\nCargo solicitado: ${cargoNome}\nAguarde a aprovação da staff.`)
          .setThumbnail(serverIcon)
          .setTimestamp();

        await interaction.update({ embeds: [replyEmbed], components: [] });
      }
      return;
    }

    // Handler para aprovação de registro (atualizado)
    if (interaction.isButton() && interaction.customId.startsWith('aprovar_registro_')) {
      // Verificar se é staff
      if (!isStaff(interaction.member)) {
        await interaction.reply({
          content: '❌ Apenas membros da staff podem aprovar registros.',
          ephemeral: true
        });
        return;
      }

      const [, , userId, cargoSolicitadoId] = interaction.customId.split('_');
      
      try {
        // Verificar permissões do bot
        const botMember = interaction.guild.members.cache.get(client.user.id);
        if (!botMember.permissions.has('ManageRoles') || !botMember.permissions.has('ManageNicknames')) {
          await interaction.reply({ 
            content: 'Não tenho permissões suficientes! Preciso das permissões "Gerenciar Cargos" e "Gerenciar Apelidos".',
            ephemeral: true
          });
          return;
        }

        // Verificar se o cargo existe
        const cargoSolicitado = interaction.guild.roles.cache.get(cargoSolicitadoId);
        
        if (!cargoSolicitado) {
          await interaction.reply({ 
            content: 'O cargo selecionado não existe mais! Peça para o membro tentar novamente.',
            ephemeral: true
          });
          return;
        }

        // Buscar a mensagem original para pegar as informações do registro
        const message = interaction.message;
        const embed = message.embeds[0];
        
        // Extrair o nome do personagem do embed
        const nomePersonagem = embed.fields.find(f => f.name === 'Nome do personagem')?.value;
        
        // Buscar o membro
        const membro = await interaction.guild.members.fetch(userId);
        const serverIcon = interaction.guild.iconURL({ dynamic: true });
        
        if (membro && nomePersonagem) {
          let successMessage = [];
          let errorMessage = [];

          // Tentar adicionar o cargo
          try {
            await membro.roles.add(cargoSolicitadoId);
            successMessage.push(`✅ Cargo ${cargoSolicitado.name} adicionado com sucesso!`);
          } catch (error) {
            console.error('Erro ao adicionar cargo:', error);
            errorMessage.push('❌ Não foi possível adicionar o cargo. O bot precisa ter a permissão "Gerenciar Cargos" e ter um cargo mais alto que o cargo a ser atribuído.');
          }

          // Tentar alterar o nickname
          try {
            await membro.setNickname(nomePersonagem);
            successMessage.push('✅ Nickname alterado com sucesso!');
          } catch (error) {
            console.error('Erro ao alterar nickname:', error);
            errorMessage.push('❌ Não foi possível alterar o nickname. O bot precisa ter a permissão "Gerenciar Apelidos" e ter um cargo mais alto que o membro.');
          }

          // Criar embed de resposta
          const responseEmbed = new EmbedBuilder()
            .setColor(successMessage.length > 0 ? 0x00FF00 : 0xFF0000)
            .setTitle(successMessage.length > 0 ? '✅ Registro Processado' : '❌ Falha no Registro')
            .setDescription(`Registro de <@${userId}>`)
            .addFields(
              { name: 'Status', value: successMessage.join('\n') || 'Nenhuma ação concluída' }
            )
            .setThumbnail(serverIcon)
            .setTimestamp();

          if (errorMessage.length > 0) {
            responseEmbed.addFields({ name: 'Erros Encontrados', value: errorMessage.join('\n') });
          }

          // Desabilitar os botões
          const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`aprovar_registro_${userId}`)
              .setLabel('Aprovado')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`recusar_registro_${userId}`)
              .setLabel('Recusar')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );

          // Atualizar a mensagem original
          await interaction.message.edit({ components: [buttonRow] });

          // Responder à interação
          await interaction.reply({ embeds: [responseEmbed], ephemeral: true });

          // Enviar DM para o membro se o cargo foi adicionado
          if (successMessage.includes(`✅ Cargo ${cargoSolicitado.name} adicionado com sucesso!`)) {
            try {
              const dmEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Registro Aprovado!')
                .setDescription(`Bem-vindo ao servidor!\nVocê recebeu o cargo: ${cargoSolicitado.name}`)
                .setThumbnail(serverIcon)
                .addFields(
                  { name: 'Status', value: successMessage.join('\n') }
                )
                .setTimestamp();

              if (!successMessage.includes('✅ Nickname alterado com sucesso!')) {
                dmEmbed.addFields({ 
                  name: 'Observação', 
                  value: 'Não foi possível alterar seu nickname automaticamente.' 
                });
              }

              await membro.send({ embeds: [dmEmbed] });
            } catch (error) {
              console.error('Erro ao enviar DM:', error);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao aprovar registro:', error);
        await interaction.reply({ content: 'Houve um erro ao aprovar o registro. Por favor, tente novamente.', ephemeral: true });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('recusar_registro_')) {
      // Verificar se é staff
      if (!isStaff(interaction.member)) {
        await interaction.reply({
          content: '❌ Apenas membros da staff podem recusar registros.',
          ephemeral: true
        });
        return;
      }

      const userId = interaction.customId.split('_')[2];
      
      try {
        const membro = await interaction.guild.members.fetch(userId);
        const serverIcon = interaction.guild.iconURL({ dynamic: true });
        
        if (membro) {
          // Criar embed para DM
          const dmEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Registro Recusado')
            .setDescription('Seu registro foi recusado.')
            .setThumbnail(serverIcon)
            .addFields({
              name: 'Próximos Passos',
              value: 'Por favor, tente novamente prestando atenção às regras do servidor.'
            })
            .setTimestamp();

          // Enviar DM para o membro
          await membro.send({ embeds: [dmEmbed] });

          // Criar embed de resposta
          const responseEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Registro Recusado')
            .setDescription(`O registro de <@${userId}> foi recusado.`)
            .setThumbnail(serverIcon)
            .setTimestamp();

          // Desabilitar os botões
          const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`aprovar_registro_${userId}`)
              .setLabel('Aprovar')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`recusar_registro_${userId}`)
              .setLabel('Recusado')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );

          // Atualizar a mensagem original
          await interaction.message.edit({ components: [buttonRow] });
          
          // Responder à interação
          await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
        }
      } catch (error) {
        console.error('Erro ao recusar registro:', error);
        await interaction.reply({ 
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('❌ Erro')
              .setDescription('Houve um erro ao recusar o registro. Por favor, tente novamente.')
              .setTimestamp()
          ],
          ephemeral: true
        });
      }
      return;
    }

    // Handler para botão de confirmação de baú
    if (interaction.isButton() && interaction.customId.startsWith('confirmar_bau_')) {
      // Verificar se é staff
      if (!isStaff(interaction.member)) {
        await interaction.reply({
          content: '❌ Apenas membros da staff podem confirmar movimentações no baú.',
          ephemeral: true
        });
        return;
      }

      const userId = interaction.customId.split('_')[2];
      const serverIcon = interaction.guild.iconURL({ dynamic: true });

      // Criar embed de resposta
      const responseEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Movimentação Confirmada')
        .setDescription(`A movimentação de baú de <@${userId}> foi confirmada.`)
        .setThumbnail(serverIcon)
        .setTimestamp();

      // Desabilitar o botão
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirmar_bau_${userId}`)
          .setLabel('Confirmado')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );

      // Atualizar a mensagem original
      await interaction.message.edit({ components: [buttonRow] });
      
      // Responder à interação
      await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
      return;
    }

    // Handlers para botões de pedidos (aceitar)
    if (interaction.isButton() && interaction.customId.startsWith('aceitar_pedido_')) {
      // Verificar se é staff
      if (!isStaff(interaction.member)) {
        await interaction.reply({
          content: '❌ Apenas membros da staff podem aceitar pedidos.',
          ephemeral: true
        });
        return;
      }

      const userId = interaction.customId.split('_')[2];
      const serverIcon = interaction.guild.iconURL({ dynamic: true });

      try {
        const membro = await interaction.guild.members.fetch(userId);
        
        // Criar embed de resposta
        const responseEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Pedido Aceito')
          .setDescription(`O pedido de <@${userId}> foi aceito e está em produção.`)
          .setThumbnail(serverIcon)
          .setTimestamp();

        // Atualizar os botões (manter apenas Concluir)
        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`aceitar_pedido_${userId}`)
            .setLabel('Aceito')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`recusar_pedido_${userId}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`concluir_pedido_${userId}`)
            .setLabel('Concluir')
            .setStyle(ButtonStyle.Primary)
        );

        // Atualizar a mensagem original
        await interaction.message.edit({ components: [buttonRow] });
        
        // Responder à interação
        await interaction.reply({ embeds: [responseEmbed], ephemeral: true });

        if (membro) {
          const dmEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Pedido Aceito')
            .setDescription('Seu pedido foi aceito e está em produção!')
            .setThumbnail(serverIcon)
            .setTimestamp();

          await membro.send({ embeds: [dmEmbed] });
        }
      } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        await interaction.reply({ 
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('❌ Erro')
              .setDescription('Houve um erro ao aceitar o pedido. Por favor, tente novamente.')
              .setTimestamp()
          ],
          ephemeral: true
        });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('recusar_pedido_')) {
      // Verificar se é staff
      if (!isStaff(interaction.member)) {
        await interaction.reply({
          content: '❌ Apenas membros da staff podem recusar pedidos.',
          ephemeral: true
        });
        return;
      }

      const userId = interaction.customId.split('_')[2];
      const serverIcon = interaction.guild.iconURL({ dynamic: true });

      try {
        const membro = await interaction.guild.members.fetch(userId);
        
        // Criar embed de resposta
        const responseEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Pedido Recusado')
          .setDescription(`O pedido de <@${userId}> foi recusado.`)
          .setThumbnail(serverIcon)
          .setTimestamp();

        // Desabilitar os botões
        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`aceitar_pedido_${userId}`)
            .setLabel('Aceitar')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`recusar_pedido_${userId}`)
            .setLabel('Recusado')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`concluir_pedido_${userId}`)
            .setLabel('Concluir')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        // Atualizar a mensagem original
        await interaction.message.edit({ components: [buttonRow] });
        
        // Responder à interação
        await interaction.reply({ embeds: [responseEmbed], ephemeral: true });

        if (membro) {
          const dmEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Pedido Recusado')
            .setDescription('Seu pedido foi recusado. Entre em contato com a administração para mais informações.')
            .setThumbnail(serverIcon)
            .setTimestamp();

          await membro.send({ embeds: [dmEmbed] });
        }
      } catch (error) {
        console.error('Erro ao recusar pedido:', error);
        await interaction.reply({ 
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('❌ Erro')
              .setDescription('Houve um erro ao recusar o pedido. Por favor, tente novamente.')
              .setTimestamp()
          ],
          ephemeral: true
        });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('concluir_pedido_')) {
      // Verificar se é staff
      if (!isStaff(interaction.member)) {
        await interaction.reply({
          content: '❌ Apenas membros da staff podem concluir pedidos.',
          ephemeral: true
        });
        return;
      }

      const userId = interaction.customId.split('_')[2];
      const serverIcon = interaction.guild.iconURL({ dynamic: true });

      try {
        const membro = await interaction.guild.members.fetch(userId);
        
        // Criar embed de resposta
        const responseEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Pedido Concluído')
          .setDescription(`O pedido de <@${userId}> foi concluído.`)
          .setThumbnail(serverIcon)
          .setTimestamp();

        // Desabilitar todos os botões
        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`aceitar_pedido_${userId}`)
            .setLabel('Aceitar')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`recusar_pedido_${userId}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`concluir_pedido_${userId}`)
            .setLabel('Concluído')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        // Atualizar a mensagem original
        await interaction.message.edit({ components: [buttonRow] });
        
        // Responder à interação
        await interaction.reply({ embeds: [responseEmbed], ephemeral: true });

        if (membro) {
          const dmEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Pedido Concluído')
            .setDescription('Seu pedido foi concluído! Por favor, retire sua encomenda.')
            .setThumbnail(serverIcon)
            .setTimestamp();

          await membro.send({ embeds: [dmEmbed] });
        }
      } catch (error) {
        console.error('Erro ao concluir pedido:', error);
        await interaction.reply({ 
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('❌ Erro')
              .setDescription('Houve um erro ao concluir o pedido. Por favor, tente novamente.')
              .setTimestamp()
          ],
          ephemeral: true
        });
      }
      return;
    }
  });
};

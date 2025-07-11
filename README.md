# Bot Discord REDM Roleplay

Este projeto é um bot para Discord focado em servidores de Roleplay de Red Dead Redemption (REDM), desenvolvido em Node.js com discord.js v14 e quick.db. Possui integração com ChatGPT para respostas de IA estilo cowboy, além de sistemas de registro, baú e pedidos.

## Funcionalidades
- Respostas de IA para perguntas sobre REDM, apenas quando o bot for mencionado.
- Sistema de registro de personagem via modal, com aprovação por staff.
- Sistema de baú para adicionar/remover itens, com logs.
- Sistema de pedidos com acompanhamento e logs.

## Tecnologias
- Node.js
- discord.js v14
- quick.db
- .env para variáveis sensíveis
- Configuração por JSON

## Como iniciar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` com seu token do Discord e outras variáveis necessárias.
3. Execute o bot:
   ```bash
   node index.js
   ```

## Estrutura sugerida
- `index.js` - Arquivo principal
- `config.json` - Configurações de canais/cargos
- `commands/` - Pasta para slashcommands
- `handlers/` - Pasta para handlers de eventos
- `database/` - Pasta para manipulação do quick.db

## Observações
- Todos os comandos devem ser implementados como slashcommands.
- O bot só responde como IA quando mencionado.
- Os sistemas de registro, baú e pedidos dependem de configuração via JSON.

---
